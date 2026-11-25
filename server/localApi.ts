import { loadEnv, type Plugin } from 'vite';
import auth from '../api/auth';
import admin from '../api/admin';
import data from '../api/data';
import ai from '../api/ai';
import google from '../api/google';

const routes = new Map([['/api/auth', auth], ['/api/admin', admin], ['/api/data', data], ['/api/ai', ai], ['/api/google', google]]);

export function localApi(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');
  for (const name of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'ADMIN_EMAILS', 'GROQ_API_KEY', 'GROQ_MODEL', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM', 'APP_ORIGIN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
    if (process.env[name] === undefined && env[name]) process.env[name] = env[name];
  }
  const configure: NonNullable<Plugin['configureServer']> = server => {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost');
      const route = routes.get(url.pathname);
      if (!route) return next();
      const response = {
        setHeader: res.setHeader.bind(res),
        end: res.end.bind(res),
        status(code: number) { res.statusCode = code; return response; },
        json(value: unknown) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(value));
        },
      };
      try {
        let body;
        if (req.method !== 'GET') {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const part of req) {
            size += part.length;
            if (size > 256_000) return response.status(413).json({ error: 'Request is too large' });
            chunks.push(part);
          }
          if (size) body = JSON.parse(Buffer.concat(chunks).toString());
        }
        await route(Object.assign(req, { body, query: Object.fromEntries(url.searchParams) }), response);
      } catch {
        if (!res.headersSent) response.status(400).json({ error: 'Invalid request' });
      }
    });
  };
  return { name: 'bagdar-local-api', configureServer: configure, configurePreviewServer: configure };
}
