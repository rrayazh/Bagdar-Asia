import { emailSettings, sendAccountEmail } from '../server/accountEmail.js';
import { db, digest, emailField, endpoint, HttpError, id, passwordHash, publicUser, requiresInvitation, secret, sessionToken, setCookie, textField, userFor, verifyPassword } from '../server/backend.js';

export default endpoint(['GET', 'POST', 'DELETE'], async (req, res) => {
  if (req.method === 'GET') return res.status(200).json(await userFor(req));
  if (req.method === 'DELETE') {
    const token = sessionToken(req);
    if (token) await (await db()).execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
    setCookie(req, res, '', 0);
    return res.status(200).json({ ok: true });
  }

  const { action, invitation, locale } = req.body || {};
  const completingLink = action === 'verify' || action === 'reset';
  if (!['register', 'signin', 'forgot', 'resend', 'verify', 'reset'].includes(action)) throw new HttpError(400, 'Invalid authentication request');
  const email = completingLink ? '' : emailField(req.body.email);
  const link = completingLink ? textField(req.body.token, 43) : '';
  if (completingLink && !/^[\w-]{43}$/.test(link)) throw new HttpError(400, 'Account link is invalid or expired');
  const needsPassword = action === 'signin' || action === 'register' || action === 'reset';
  const password = needsPassword ? textField(req.body.password, 256) : '';
  if ((action === 'register' || action === 'reset') && password.length < 8) throw new HttpError(400, 'Use at least 8 characters for your password');
  const client = await db();
  const now = Date.now();
  const ip = String((process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : undefined) || req.socket?.remoteAddress || 'unknown');
  const limits = await client.batch([digest('ip:' + ip), digest(completingLink ? 'link:' + link : 'email:' + email)].map(key => ({
    sql: 'INSERT INTO auth_attempts VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN expires <= ? THEN 1 ELSE count + 1 END, expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END RETURNING count',
    args: [key, now + 900_000, now, now],
  })), 'write');
  if (Number(limits[0].rows[0].count) > 100 || Number(limits[1].rows[0].count) > 20) {
    throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  }

  if (completingLink) {
    const filter = 'SELECT user_id FROM account_links WHERE hash = ? AND kind = ? AND expires > ?';
    const args = [digest(link), action, now];
    const passwordUpdate = action === 'reset' ? [
      { sql: 'UPDATE users SET password = ? WHERE id IN (' + filter + ')', args: [await passwordHash(password), ...args] },
      { sql: 'DELETE FROM sessions WHERE user_id IN (' + filter + ')', args },
    ] : [];
    const results = await client.batch([
      ...passwordUpdate,
      { sql: 'INSERT INTO verified_emails SELECT user_id FROM account_links WHERE hash = ? AND kind = ? AND expires > ? ON CONFLICT(user_id) DO NOTHING', args },
      ...(action === 'reset' ? [{ sql: "DELETE FROM account_links WHERE kind = 'verify' AND user_id IN (" + filter + ')', args }] : []),
      { sql: 'DELETE FROM account_links WHERE hash = ? AND kind = ? AND expires > ?', args },
    ], 'write');
    if (!results.at(-1).rowsAffected) throw new HttpError(400, 'Account link is invalid or expired');
    return res.status(200).json({ ok: true });
  }

  const deliver = async (userId: string, kind: 'verify' | 'reset') => {
    const token = secret();
    const hash = digest(token);
    const expires = now + (kind === 'verify' ? 86_400_000 : 30 * 60_000);
    const previous = await client.execute({ sql: 'SELECT hash, expires FROM account_links WHERE user_id = ? AND kind = ?', args: [userId, kind] });
    await client.execute({
      sql: 'INSERT INTO account_links VALUES (?, ?, ?, ?) ON CONFLICT(user_id, kind) DO UPDATE SET hash = excluded.hash, expires = excluded.expires',
      args: [userId, kind, hash, expires],
    });
    try {
      await sendAccountEmail(email, kind, token, locale);
    } catch (error) {
      const row = previous.rows[0];
      await client.execute(row ? {
        sql: 'UPDATE account_links SET hash = ?, expires = ? WHERE hash = ?', args: [row.hash, row.expires, hash],
      } : { sql: 'DELETE FROM account_links WHERE hash = ?', args: [hash] });
      throw error;
    }
  };

  const found = await client.execute({ sql: 'SELECT users.*, verified_emails.user_id AS verified FROM users LEFT JOIN verified_emails ON users.id = verified_emails.user_id WHERE email = ?', args: [email] });
  let row = found.rows[0];
  if (action === 'forgot' || action === 'resend') {
    emailSettings();
    if (row?.password && (action === 'forgot' || !row.verified)) {
      try { await deliver(String(row.id), action === 'forgot' ? 'reset' : 'verify'); }
      catch { /* Keep the response the same for all email addresses. */ }
    }
    return res.status(200).json({ ok: true });
  }

  if (action === 'signin') {
    if (!(await verifyPassword(password, typeof row?.password === 'string' ? row.password : null))) {
      throw new HttpError(401, 'Email or password is incorrect');
    }
    if (!row.verified) throw new HttpError(403, 'Verify your email before signing in');
  } else {
    emailSettings();
    const name = textField(req.body.name, 120).trim();
    const country = textField(req.body.targetCountry, 120).trim();
    const hash = await passwordHash(password);
    if (row || typeof invitation === 'string' && invitation) {
      if (typeof invitation !== 'string' || invitation.length !== 43) throw new HttpError(409, 'Sign in or use your invitation link');
      const result = await client.execute({
        sql: 'UPDATE users SET password = ?, invitation = NULL, invitation_expires = NULL WHERE email = ? AND password IS NULL AND invitation = ? AND invitation_expires > ? RETURNING *',
        args: [hash, email, digest(invitation), now],
      });
      row = result.rows[0];
      if (!row) throw new HttpError(400, 'Invitation is invalid or expired');
    } else {
      if (requiresInvitation(email)) throw new HttpError(403, 'This administrator account requires an invitation');
      const result = await client.execute({
        sql: 'INSERT INTO users (id, email, name, country, password, created) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING RETURNING *',
        args: [id(), email, name, country, hash, new Date(now).toISOString()],
      });
      row = result.rows[0];
      if (!row) throw new HttpError(409, 'Sign in or use your invitation link');
    }
    await deliver(String(row.id), 'verify');
    return res.status(201).json({ verificationRequired: true });
  }

  const token = secret();
  const results = await client.batch([
    { sql: 'DELETE FROM sessions WHERE expires <= ? OR token = ?', args: [now, sessionToken(req) || ''] },
    { sql: 'DELETE FROM auth_attempts WHERE expires <= ?', args: [now] },
    { sql: 'UPDATE users SET last_sign_in = ? WHERE id = ? AND password = ?', args: [new Date(now).toISOString(), row.id, row.password] },
    { sql: 'INSERT INTO sessions SELECT ?, id, ? FROM users WHERE id = ? AND password = ?', args: [digest(token), now + 14 * 86_400_000, row.id, row.password] },
  ], 'write');
  if (!results.at(-1).rowsAffected) throw new HttpError(401, 'Email or password is incorrect');
  setCookie(req, res, token);
  return res.status(200).json(publicUser(row));
});
