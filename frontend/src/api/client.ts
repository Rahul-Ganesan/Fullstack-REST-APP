export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export interface ApiError {
  message: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(errorPayload?.message ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
