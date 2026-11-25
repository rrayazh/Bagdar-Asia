# Bagdar Asia

Use Node.js 22 or later and run `npm ci`. Copy `.env.example` to `.env.local`. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for Turso Cloud. For local development with a SQLite file, set `TURSO_DATABASE_URL=file:bagdar.db`. Run `npm run dev` and open http://localhost:3000. The API initializes the database schema on first use.

## Administrator access

Add the administrator's email to `ADMIN_EMAILS` in `.env.local` and in the Vercel environment. Generate a registration invitation against the same database the app uses.

```sh
node --experimental-transform-types --env-file=.env.local scripts/invite-admin.mts admin@example.com "Admin Name" Kazakhstan
```

Append the printed path to the website URL, open it, and register with the specified email. The private invitation expires after 24 hours. The administrator dashboard creates candidate invitation links for the administrator to share directly. Registration signs users in immediately. The browser keeps the session for 14 days. Users can still request a verification email from the sign-in dialog. Password reset links expire after 30 minutes and revoke all existing sessions when redeemed. Verification links expire after 24 hours.

## Deployment

Set the server-only variables from `.env.example` in Vercel for the target environment. Configure a Resend API key, verified sender and exact deployment origin before enabling account email and password recovery. Set `APP_ORIGIN=http://localhost:3000` for local email links. Set `GEMINI_API_KEY` to enable the AI tools, Google Search, and Google Maps grounding. Run `npm run lint` and `npm run build` before deploying.

Calendar reminders are delivered by the calendar app after an applicant imports the downloaded event.

This schema starts with an empty database. Existing accounts and records require a separate migration before moving a live installation.

For Production, set `BAGDAR_DATABASE_URL` and `BAGDAR_DATABASE_AUTH_TOKEN` together to pin the app to the main Turso database across deploys. Preview environments can use the Turso integration's deployment-specific branches via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.


## Google sign-in

Create a Web application OAuth client in Google Auth Platform. For this production site, use the authorized redirect URI `https://bagdar-asia.vercel.app/api/google`. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `APP_ORIGIN=https://bagdar-asia.vercel.app` to the Vercel Production environment, then redeploy. For local testing, use `APP_ORIGIN=http://localhost:3000` and separately authorize `http://localhost:3000/api/google`. Configure the Google app audience for the intended users.

Google sign-in supports new Gmail and Google Workspace users. It uses the Google account's stable identity and stores profiles, sessions and application data in Turso. Existing password accounts and administrators keep their original sign-in method. Resend remains necessary for password-based registration and recovery.
