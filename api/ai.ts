import { createClient } from '@supabase/supabase-js';

const MAX_PROMPT_LENGTH = 30_000;
const DAILY_REQUEST_LIMIT = 20;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  const bearerToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearerToken || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(401).json({ error: 'Sign in is required to use AI tools' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    auth: { persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(bearerToken);
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Your session is invalid or expired' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: usageError } = await adminClient
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', authData.user.id)
    .gte('created_at', periodStart);
  if (usageError) return res.status(503).json({ error: 'Usage tracking is temporarily unavailable' });
  if ((count || 0) >= DAILY_REQUEST_LIMIT) {
    return res.status(429).json({ error: `Daily AI limit reached (${DAILY_REQUEST_LIMIT} requests)` });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service is not configured' });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are Bagdar Asia, a careful admissions assistant. Never invent deadlines or requirements; clearly label uncertainty.' },
        { role: 'user', content: prompt },
      ],
      response_format: req.body?.jsonMode ? { type: 'json_object' } : undefined,
      temperature: 0.5,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({ error: data?.error?.message || 'AI provider request failed' });
  }

  await adminClient.from('ai_usage').insert({
    user_id: authData.user.id,
    feature: String(req.body?.feature || 'assistant').slice(0, 80),
    provider: 'openai',
  });

  res.setHeader('X-RateLimit-Limit', String(DAILY_REQUEST_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, DAILY_REQUEST_LIMIT - (count || 0) - 1)));
  return res.status(200).json({ text: data.choices?.[0]?.message?.content || '' });
}
