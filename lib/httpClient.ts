let currentUserId: string | null = null;
export const setRequestUser = (id: string | null) => { currentUserId = id; };
export async function apiRequest<T>(path: string, method = "GET", body?: unknown, expectedUserId?: string): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", ...((expectedUserId || currentUserId) ? { "X-FinDash-User": expectedUserId || currentUserId! } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed. Please retry.");
  return data as T;
}
