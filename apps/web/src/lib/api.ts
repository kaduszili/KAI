const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly code:   string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  method: string,
  path:   string,
  body?:  unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new ApiError(
      json.error ?? 'Request failed',
      json.code  ?? 'unknown_error',
      res.status,
    )
  }

  return json.data as T
}

export const api = {
  get:    <T>(path: string)                 => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)  => request<T>('POST',   path, body),
  patch:  <T>(path: string, body: unknown)  => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
}
