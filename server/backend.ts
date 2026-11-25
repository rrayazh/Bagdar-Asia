import { createClient } from '@libsql/client/web';
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { User } from '../types';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const schema = [
  "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, country TEXT NOT NULL, password TEXT, invitation TEXT, invitation_expires INTEGER, created TEXT NOT NULL, last_sign_in TEXT, admin_eligible INTEGER NOT NULL DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS verified_emails (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE)",
  "CREATE TABLE IF NOT EXISTS account_links (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, hash TEXT NOT NULL UNIQUE, expires INTEGER NOT NULL, PRIMARY KEY(user_id, kind))",
  "CREATE TRIGGER IF NOT EXISTS remove_account_email AFTER DELETE ON users BEGIN DELETE FROM verified_emails WHERE user_id = OLD.id; DELETE FROM account_links WHERE user_id = OLD.id; END",
  "CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)",
  "CREATE TABLE IF NOT EXISTS records (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(user_id, kind, id))",
  "CREATE TABLE IF NOT EXISTS ai_usage (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created INTEGER NOT NULL, feature TEXT NOT NULL)",
  "CREATE TRIGGER IF NOT EXISTS remove_account_data AFTER DELETE ON users BEGIN DELETE FROM sessions WHERE user_id = OLD.id; DELETE FROM records WHERE user_id = OLD.id; DELETE FROM ai_usage WHERE user_id = OLD.id; END",
  "CREATE INDEX IF NOT EXISTS ai_usage_user_created ON ai_usage(user_id, created)",
  "CREATE TABLE IF NOT EXISTS admin_audit (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS auth_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)",
];

let database: Promise<ReturnType<typeof createClient>> | undefined;
export function db() {
  database ??= (async () => {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new HttpError(503, 'Database is not configured');
    if (process.env.VERCEL && url.startsWith('file:')) throw new HttpError(503, 'Database is not configured');
    const factory = url.startsWith('file:') ? (await import('@libsql/client')).createClient : createClient;
    const client = factory({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    await client.batch(schema, 'write');
    return client;
  })().catch(error => { database = undefined; throw error; });
  return database;
}

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
export const id = randomUUID;
const derive = promisify(scrypt);
export async function passwordHash(password: string, salt = randomBytes(16).toString('hex')) {
  return salt + ':' + (await derive(password, salt, 64) as Buffer).toString('hex');
}
const admins = () => (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(email => email.trim()).filter(Boolean);

export function publicUser(row: Record<string, unknown>): User {
  const email = String(row.email);
  return {
    id: String(row.id), email, name: String(row.name), targetCountry: String(row.country),
    registeredAt: String(row.created).split('T')[0],
    role: row.admin_eligible === 1 && admins().includes(email) ? 'admin' : 'user',
  };
}

const cookie = 'bagdar_session';
const duration = 60 * 60 * 24 * 14;
export function sessionToken(req: any) {
  const token = String(req.headers.cookie || '').match(/(?:^|;\s*)bagdar_session=([a-zA-Z0-9_-]{43})(?:;|$)/)?.[1];
  return token ? digest(token) : undefined;
}
export function setCookie(req: any, res: any, value: string, maxAge = duration) {
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https' || req.socket?.encrypted;
  res.setHeader('Set-Cookie', `${cookie}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`);
}
export async function userFor(req: any) {
  const token = sessionToken(req);
  if (!token) return null;
  const { rows } = await (await db()).execute({
    sql: 'SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id JOIN verified_emails ON verified_emails.user_id = users.id WHERE token = ? AND expires > ?',
    args: [token, Date.now()],
  });
  return rows[0] ? publicUser(rows[0]) : null;
}
export async function requireUser(req: any) {
  const user = await userFor(req);
  if (!user) throw new HttpError(401, 'Sign in is required');
  return user;
}
export function endpoint(methods: string[], handler: (req: any, res: any) => Promise<unknown>) {
  return async (req: any, res: any) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (req.method !== 'GET' && (req.headers['sec-fetch-site'] === 'cross-site' ||
        (req.headers.origin && !['http://', 'https://'].some(protocol => req.headers.origin === protocol + req.headers.host)))) {
      return res.status(403).json({ error: 'Invalid request origin' });
    }
    if (req.method !== 'GET' && !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      return res.status(415).json({ error: 'JSON is required' });
    }
    try { return await handler(req, res); }
    catch (error) {
      if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
      console.error('API request failed', error instanceof Error ? error.name : 'Unknown error');
      return res.status(503).json({ error: 'Service is temporarily unavailable' });
    }
  };
}
export function textField(value: unknown, length: number, required = true) {
  if (typeof value !== 'string' || value.length > length || (required && !value.trim())) {
    throw new HttpError(400, 'Invalid form fields');
  }
  return value;
}
export function emailField(value: unknown) {
  const email = textField(value, 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');
  return email;
}
export async function verifyPassword(password: string, stored: string | null) {
  const expected = stored || ('0'.repeat(32) + ':' + '0'.repeat(128));
  const actual = await passwordHash(password, expected.split(':')[0]);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual)) && Boolean(stored);
}
export const requiresInvitation = (email: string) => admins().includes(email);
