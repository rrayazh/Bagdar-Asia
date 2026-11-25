export async function request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(path, method === 'GET' ? undefined : {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data ?? {}),
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok || payload === undefined) throw new Error(payload?.error || 'Service is temporarily unavailable');
  return payload;
}
