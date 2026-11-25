# Bagdar Asia

Use Node.js 22 or later and run `npm ci`. Copy `.env.example` to `.env.local`. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for Turso Cloud. For local development with a SQLite file, set `TURSO_DATABASE_URL=file:bagdar.db`. Run `npm run dev` and open http://localhost:3000. The API initializes the database schema on first use.

## Administrator access

Add the administrator's email to `ADMIN_EMAILS` in `.env.local` and in the Vercel environment. Generate a registration invitation against the same database the app uses.

```sh
node --experimental-transform-types --env-file=.env.local scripts/invite-admin.mts admin@example.com "Admin Name" Kazakhstan
```

Append the printed path to the website URL, open it, and register with the specified email. The private invitation expires after 24 hours. The administrator dashboard creates candidate invitation links for the administrator to share directly. Registrants receive a verification link and sign in after confirming their email. Existing accounts can request a verification email from the sign-in dialog. Password reset links expire after 30 minutes and revoke all existing sessions when redeemed. Verification links expire after 24 hours.

## Deployment

Set the server-only variables from `.env.example` in Vercel for the target environment. Configure a Resend API key, verified sender and exact deployment origin before enabling email-based registration and recovery. Set `APP_ORIGIN=http://localhost:3000` for local email links. Set `GROQ_API_KEY` to enable the text-based AI tools. Run `npm run lint` and `npm run build` before deploying.

Calendar reminders are delivered by the calendar app after an applicant imports the downloaded event.

This schema starts with an empty database. Existing accounts and records require a separate migration before moving a live installation.
