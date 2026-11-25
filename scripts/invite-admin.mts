import { db, digest, emailField, id, requiresInvitation, secret, textField } from '../server/backend.ts';

const email = emailField(process.argv[2]);
const name = textField(process.argv[3], 120).trim();
const country = textField(process.argv[4], 120).trim();
if (!requiresInvitation(email)) throw new Error('Add this email to ADMIN_EMAILS first');

const invitation = secret();
const now = Date.now();
const result = await (await db()).execute({
  sql: `INSERT INTO users (id, email, name, country, invitation, invitation_expires, created, admin_eligible)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(email) DO UPDATE SET invitation = excluded.invitation, invitation_expires = excluded.invitation_expires
      WHERE users.admin_eligible = 1 AND users.password IS NULL`,
  args: [id(), email, name, country, digest(invitation), now + 86_400_000, new Date(now).toISOString()],
});
if (!result.rowsAffected) throw new Error('An active or non-administrator account already uses this email');
console.log('/#invite=' + invitation);
