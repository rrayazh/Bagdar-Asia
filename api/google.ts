import { createHash } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { db, digest, emailField, endpoint, id, requiresInvitation, secret, sessionToken, setCookie, SESSION_SECONDS } from '../server/backend.js';

const flowCookie = 'bagdar_google_flow';
const route = '/api/google';
const allowedLocales = ['en', 'kk', 'ru'];

function settings() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_ORIGIN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_ORIGIN) return null;
  try {
    const url = new URL(APP_ORIGIN);
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.origin !== APP_ORIGIN || (url.protocol !== 'https:' && (!local || process.env.VERCEL))) return null;
    return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, origin: url.origin, secure: url.protocol === 'https:' };
  } catch {
    return null;
  }
}

function redirect(res: any, target: string) {
  res.setHeader('Location', target);
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.status(303).end();
}

export default endpoint(['GET'], async (req, res) => {
  const config = settings();
  if (req.query?.status === '1') return res.status(200).json({ enabled: Boolean(config) });
  if (!config) return redirect(res, '/#google=unavailable');
  const callback = config.origin + route;
  const secure = config.secure ? '; Secure' : '';
  const cookie = (value: string, age: number) => `${flowCookie}=${value}; Path=${route}; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`;

  if (!Object.hasOwn(req.query || {}, 'state') && !Object.hasOwn(req.query || {}, 'error') && !Object.hasOwn(req.query || {}, 'code')) {
    const state = secret();
    const verifier = secret();
    const nonce = secret();
    const locale = allowedLocales.includes(req.query?.locale) ? req.query.locale : 'en';
    const params = new URLSearchParams({
      client_id: config.clientId, redirect_uri: callback, response_type: 'code',
      scope: 'openid email profile', state, nonce, hl: locale, prompt: 'select_account',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    });
    res.setHeader('Set-Cookie', cookie([state, verifier, nonce].join('.'), 600));
    return redirect(res, 'https://accounts.google.com/o/oauth2/v2/auth?' + params);
  }

  const flow = String(req.headers.cookie || '').match(/(?:^|;\s*)bagdar_google_flow=([\w-]{43})\.([\w-]{43})\.([\w-]{43})(?:;|$)/);
  const clearFlow = cookie('', 0);
  res.setHeader('Set-Cookie', clearFlow);
  const code = req.query?.code;
  if (!flow || flow[1] !== req.query.state) return redirect(res, '/#google=failed');
  if (req.query?.error === 'access_denied') return redirect(res, '/#google=cancelled');
  if (typeof code !== 'string' || !code || code.length > 2048) return redirect(res, '/#google=failed');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({
      code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: callback,
      code_verifier: flow[2], grant_type: 'authorization_code',
    }),
  }).catch(() => null);
  if (!tokenResponse?.ok) return redirect(res, '/#google=failed');

  const tokens = await tokenResponse.json().catch(() => null);
  if (typeof tokens?.id_token !== 'string') return redirect(res, '/#google=failed');
  const oauth = new OAuth2Client(config.clientId);
  const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: config.clientId }).catch(() => null);
  const profile = ticket?.getPayload();
  if (!profile?.sub || !profile.email || !profile.email_verified || profile.nonce !== flow[3]) {
    return redirect(res, '/#google=failed');
  }
  const email = emailField(profile.email);
  if (!email.endsWith('@gmail.com') && !profile.hd) return redirect(res, '/#google=email');

  try {
    const client = await db();
    const now = Date.now();
    const userId = id();
    const subject = profile.sub;
    const name = (profile.name?.trim() || email.split('@')[0]).slice(0, 120);
    if (!requiresInvitation(email)) {
      await client.batch([
        { sql: "INSERT INTO users (id, email, name, country, created) SELECT ?, ?, ?, 'Not selected', ? WHERE NOT EXISTS (SELECT 1 FROM google_identities WHERE subject = ?) ON CONFLICT(email) DO NOTHING", args: [userId, email, name, new Date(now).toISOString(), subject] },
        { sql: 'INSERT INTO google_identities SELECT ?, id FROM users WHERE id = ?', args: [subject, userId] },
        { sql: 'INSERT INTO verified_emails SELECT user_id FROM google_identities WHERE user_id = ?', args: [userId] },
      ], 'write');
    }

    const token = secret();
    const authorized = 'SELECT users.id FROM google_identities JOIN users ON users.id = google_identities.user_id JOIN verified_emails ON verified_emails.user_id = users.id WHERE subject = ? AND email = ? AND admin_eligible = 0';
    const results = await client.batch([
      { sql: 'INSERT INTO sessions SELECT ?, id, ? FROM (' + authorized + ')', args: [digest(token), now + SESSION_SECONDS * 1000, subject, email] },
      { sql: 'UPDATE users SET last_sign_in = ? WHERE id IN (' + authorized + ')', args: [new Date(now).toISOString(), subject, email] },
      { sql: 'DELETE FROM sessions WHERE expires <= ? OR (token = ? AND EXISTS (' + authorized + '))', args: [now, sessionToken(req) || '', subject, email] },
    ], 'write');
    if (!results[0].rowsAffected) return redirect(res, '/#google=existing');

    setCookie(req, res, token, SESSION_SECONDS, [clearFlow]);
    return redirect(res, '/profile');
  } catch {
    console.error('Google account sign-in failed at the database step');
    return redirect(res, '/#google=failed');
  }
});
