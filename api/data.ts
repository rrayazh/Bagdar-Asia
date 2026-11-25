import { db, endpoint, HttpError, id, requireUser, textField } from '../server/backend.js';

const statuses = ['researching', 'shortlisted', 'documents', 'submitted', 'interview', 'decision'];
const kinds = ['profile', 'planner', 'deadline', 'university', 'application'];

export default endpoint(['GET', 'POST'], async (req, res) => {
  const user = await requireUser(req);
  const { kind, action, key, value } = req.method === 'GET' ? req.query : req.body || {};
  if (!kinds.includes(kind)) throw new HttpError(400, 'Invalid data type');
  const client = await db();
  if (req.method === 'GET') {
    const { rows } = await client.execute({
      sql: 'SELECT value FROM records WHERE user_id = ? AND kind = ? ORDER BY CASE WHEN kind = \'application\' THEN -updated ELSE updated END, rowid',
      args: [user.id, kind],
    });
    const values = rows.map(row => JSON.parse(String(row.value)));
    return res.status(200).json(kind === 'profile' ? values[0] ?? null : values);
  }

  const rowId = kind === 'profile' ? 'profile' : action === 'create' && kind === 'planner' ? id() : textField(key, 120);
  if (action === 'delete' && kind !== 'profile') {
    await client.execute({ sql: 'DELETE FROM records WHERE user_id = ? AND kind = ? AND id = ?', args: [user.id, kind, rowId] });
    return res.status(200).json({ ok: true });
  }

  let data: unknown;
  let patch = false;
  if (kind === 'profile' && action === 'save' && value && typeof value === 'object') {
    const { gpa, sat, ielts, major, targetIntake, targetCountries, checklist } = value;
    if (!Array.isArray(targetCountries) || targetCountries.length > 20 || !checklist || typeof checklist !== 'object' || Array.isArray(checklist) || Object.keys(checklist).length > 100) {
      throw new HttpError(400, 'Invalid profile');
    }
    for (const [item, checked] of Object.entries(checklist)) {
      textField(item, 100);
      if (typeof checked !== 'boolean') throw new HttpError(400, 'Invalid checklist');
    }
    data = {
      gpa: textField(gpa, 50, false), sat: textField(sat, 50, false), ielts: textField(ielts, 50, false),
      major: textField(major, 160, false), targetIntake: textField(targetIntake, 80, false),
      targetCountries: targetCountries.map(country => textField(country, 120)), checklist,
    };
  } else if (kind === 'planner' && action === 'create' && value && typeof value.done === 'boolean') {
    data = { id: rowId, cat: textField(value.cat, 120), label: textField(value.label, 500), done: value.done };
  } else if (kind === 'planner' && action === 'update' && typeof value?.done === 'boolean') {
    data = { done: value.done };
    patch = true;
  } else if ((kind === 'deadline' || kind === 'university') && action === 'save') {
    data = rowId;
  } else if (kind === 'application' && action === 'save' && statuses.includes(value?.status)) {
    const { rows } = await client.execute({
      sql: "INSERT INTO records VALUES (?, 'application', ?, ?, ?) ON CONFLICT(user_id, kind, id) DO UPDATE SET value = json_set(records.value, '$.status', ?), updated = excluded.updated RETURNING value",
      args: [user.id, rowId, JSON.stringify({ id: rowId, universityId: rowId, status: value.status, notes: '' }), Date.now(), value.status],
    });
    return res.status(200).json(JSON.parse(String(rows[0].value)));
  } else if (kind === 'application' && action === 'update' && value && (value.status !== undefined || value.notes !== undefined)) {
    if (value.status !== undefined && !statuses.includes(value.status)) throw new HttpError(400, 'Invalid application status');
    data = {
      status: value.status,
      notes: value.notes === undefined ? undefined : textField(value.notes, 10_000, false),
    };
    patch = true;
  } else {
    throw new HttpError(400, 'Invalid data request');
  }

  const now = Date.now();
  const result = await client.execute(patch ? {
    sql: "UPDATE records SET value = json_patch(value, ?), updated = CASE WHEN kind = 'planner' THEN updated ELSE ? END WHERE user_id = ? AND kind = ? AND id = ? RETURNING value",
    args: [JSON.stringify(data), now, user.id, kind, rowId],
  } : {
    sql: 'INSERT INTO records VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, kind, id) DO UPDATE SET value = excluded.value, updated = excluded.updated RETURNING value',
    args: [user.id, kind, rowId, JSON.stringify(data), now],
  });
  if (!result.rows.length) throw new HttpError(404, 'Record not found');
  return res.status(200).json(JSON.parse(String(result.rows[0].value)));
});
