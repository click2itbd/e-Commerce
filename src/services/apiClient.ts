const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4);
  }

  const url = `${cleanBase}${cleanPath}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export function getApiUrl(path: string): string {
  const base = (import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '')).replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${base}${cleanPath.slice(4)}`;
  }
  return `${base}${cleanPath}`;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' }, token);
}

export async function apiPost<T>(path: string, body: any, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }, token);
}

export async function apiPut<T>(path: string, body: any, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, token);
}

export async function apiDelete<T>(path: string, token?: string, body?: any): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  }, token);
}

export { API_BASE_URL };
