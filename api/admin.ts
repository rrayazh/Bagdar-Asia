import { createClient } from '@supabase/supabase-js';

const jsonError = (res: any, status: number, message: string) => res.status(status).json({ error: message });

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return jsonError(res, 405, 'Method not allowed');
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonError(res, 401, 'Administrator sign-in is required');
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return jsonError(res, 401, 'Session is invalid or expired');
  if (authData.user.app_metadata?.role !== 'admin') return jsonError(res, 403, 'Administrator access required');

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (req.method === 'GET') {
    const [authUsers, profiles, applications, aiUsage] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('profiles').select('id, full_name, target_country'),
      admin.from('applications').select('id', { count: 'exact', head: true }),
      admin.from('ai_usage').select('id', { count: 'exact', head: true }),
    ]);
    if (authUsers.error || profiles.error || applications.error || aiUsage.error) {
      return jsonError(res, 503, 'Admin data is temporarily unavailable');
    }

    const profileById = new Map((profiles.data || []).map((profile: any) => [profile.id, profile]));
    const users = authUsers.data.users.map((user) => {
      const profile: any = profileById.get(user.id);
      return {
        id: user.id,
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: user.email || '',
        targetCountry: profile?.target_country || user.user_metadata?.target_country || 'Not selected',
        registeredAt: user.created_at.split('T')[0],
        role: user.app_metadata?.role === 'admin' ? 'admin' : 'user',
        lastSignInAt: user.last_sign_in_at || null,
        emailConfirmed: Boolean(user.email_confirmed_at),
      };
    });

    return res.status(200).json({
      users,
      stats: { users: users.length, applications: applications.count || 0, aiRequests: aiUsage.count || 0 },
    });
  }

  if (req.method === 'POST') {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const targetCountry = String(req.body?.targetCountry || '').trim();
    if (!name || !email || !targetCountry || name.length > 120 || targetCountry.length > 120) {
      return jsonError(res, 400, 'Name, email and target country are required');
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name, target_country: targetCountry },
    });
    if (error || !data.user) return jsonError(res, 400, error?.message || 'Could not invite candidate');
    await admin.from('admin_audit_log').insert({
      admin_user_id: authData.user.id,
      action: 'user.invited',
      target_user_id: data.user.id,
      metadata: { email, target_country: targetCountry },
    });
    return res.status(201).json({ userId: data.user.id });
  }

  const userId = String(req.body?.userId || '');
  if (!userId) return jsonError(res, 400, 'User ID is required');
  if (userId === authData.user.id) return jsonError(res, 400, 'You cannot delete your own administrator account');
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return jsonError(res, 400, error.message);
  await admin.from('admin_audit_log').insert({
    admin_user_id: authData.user.id,
    action: 'user.deleted',
    metadata: { deleted_user_id: userId },
  });
  return res.status(200).json({ ok: true });
}
