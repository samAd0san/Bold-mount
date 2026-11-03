// Tiny browser helper for POSTing JSON to our own /api routes; never throws.
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function postJson<T = unknown>(url: string, body: unknown = {}, keepalive = false): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
      keepalive,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = typeof data?.error === 'string' && data.error ? data.error : 'Something went wrong. Please try again.';
      return { ok: false, status: res.status, error };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: 'Couldn’t reach the server. Check your connection and try again.' };
  }
}
