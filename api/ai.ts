const MAX_PROMPT_LENGTH = 30_000;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: 'Invalid prompt' });
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

  return res.status(200).json({ text: data.choices?.[0]?.message?.content || '' });
}
