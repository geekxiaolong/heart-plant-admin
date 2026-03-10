/**
 * 统一的 API 请求工具
 * 确保所有请求都携带正确的认证头
 */
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from './supabaseClient';

const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000'
  : `https://${projectId}.supabase.co/functions/v1/make-server-4b732228`;

export function apiUrl(endpoint: string): string {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * 获取当前用户的 session token
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * 构建标准请求头
 */
export async function buildApiHeaders(includeContentType: boolean = false): Promise<Record<string, string>> {
  const token = await getSessionToken();

  const headers: Record<string, string> = {
    'apikey': publicAnonKey,
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-User-JWT'] = token;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * 处理 API 响应
 */
export async function parseApiJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

export function unwrapApiPayload<T>(payload: any): T {
  if (payload == null || Array.isArray(payload) || typeof payload !== 'object') {
    return payload as T;
  }

  if ('data' in payload) return payload.data as T;
  if ('result' in payload) return payload.result as T;
  if ('items' in payload) return payload.items as T;

  return payload as T;
}

export function isApiFailure(payload: any): boolean {
  return Boolean(payload && typeof payload === 'object' && payload.success === false);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await parseApiJson(response);

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || `API Error: ${response.status} ${response.statusText}`;
    if (payload) {
      console.error('API Error Details:', payload);
    } else {
      console.error('API Error (empty response):', errorMessage);
    }
    throw new Error(errorMessage);
  }

  if (isApiFailure(payload)) {
    throw new Error(payload?.error || payload?.message || 'Request failed');
  }

  return unwrapApiPayload<T>(payload);
}

/**
 * GET 请求
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders();

  console.log(`[API GET] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API GET Error] ${url}:`, error);
    throw error;
  }
}

/**
 * POST 请求
 */
export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders(true);

  console.log(`[API POST] ${url}`, body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API POST Error] ${url}:`, error);
    throw error;
  }
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders();

  console.log(`[API DELETE] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API DELETE Error] ${url}:`, error);
    throw error;
  }
}

/**
 * PUT 请求
 */
export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders(true);

  console.log(`[API PUT] ${url}`, body);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API PUT Error] ${url}:`, error);
    throw error;
  }
}
