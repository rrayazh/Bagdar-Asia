import { db, digest, emailField, endpoint, HttpError, id, publicUser, requiresInvitation, requireUser, secret, textField } from '../server/backend';

export default endpoint(['GET', 'POST', 'DELETE'], async (req, res) => {
  const actor = await requireUser(req);
  if (actor.role !== 'admin') throw new HttpError(403, 'Administrator access required');
  const client = await db();

  if (req.method === 'GET') {
    const [accounts, applications, usage] = await client.batch([
      'SELECT * FROM users ORDER BY created DESC',
      "SELECT count(*) AS total FROM records WHERE kind = 'application'",
      'SELECT count(*) AS total FROM ai_usage',
    ], 'read');
    const users = accounts.rows.map(row => ({
      ...publicUser(row), lastSignInAt: row.last_sign_in, registrationComplete: Boolean(row.password),
    }));
    return res.status(200).json({
      users, stats: { users: users.length, applications: Number(applications.rows[0].total), aiRequests: Number(usage.rows[0].total) },
    });
  }

  if (req.method === 'POST') {
    const email = emailField(req.body?.email);
    if (requiresInvitation(email)) throw new HttpError(400, 'Use the administrator registration script for this email');
    const name = textField(req.body?.name, 120).trim();
    const country = textField(req.body?.targetCountry, 120).trim();
    const invitation = secret();
    const now = Date.now();
    const userId = id();
    const [result] = await client.batch([
      { sql: 'INSERT INTO users (id, email, name, country, invitation, invitation_expires, created) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING', args: [userId, email, name, country, digest(invitation), now + 86_400_000, new Date(now).toISOString()] },
      { sql: "INSERT INTO admin_audit SELECT ?, ?, 'user.invited', id, ? FROM users WHERE id = ?", args: [id(), actor.id, now, userId] },
    ], 'write');
    if (!result.rowsAffected) throw new HttpError(409, 'An account or invitation already exists for this email');
    return res.status(201).json({ userId, invitation });
  }

  const userId = textField(req.body?.userId, 80);
  if (userId === actor.id) throw new HttpError(400, 'You cannot delete your own administrator account');
  const [result] = await client.batch([
    { sql: 'DELETE FROM users WHERE id = ? AND admin_eligible = 0', args: [userId] },
    { sql: "INSERT INTO admin_audit SELECT ?, ?, 'user.deleted', ?, ? WHERE changes() > 0", args: [id(), actor.id, userId, Date.now()] },
  ], 'write');
  if (!result.rowsAffected) throw new HttpError(404, 'Candidate is unavailable for deletion');
  return res.status(200).json({ ok: true });
});
