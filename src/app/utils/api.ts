/**
 * 统一的 API 请求工具
 * 确保所有请求都携带正确的认证头
 */
import { projectId } from '/utils/supabase/info';
import { supabase, effectiveAnonKey } from './supabaseClient';

const isLocalDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');
const API_BASE_URL = isLocalDev
  ? 'http://192.168.1.149:8000'
  : `https://${projectId}.supabase.co/functions/v1/make-server-4b732228`;

export function apiUrl(endpoint: string): string {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * 获取当前用户的 session token（会先尝试刷新，避免过期 JWT 导致 Invalid JWT）
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    // 若 token 已过期或即将过期，先刷新再返回，避免后端返回 Invalid JWT
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const bufferSeconds = 60;
    if (expiresAt != null && expiresAt < now + bufferSeconds) {
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      return refreshed?.access_token ?? session.access_token;
    }
    return session.access_token;
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
    'apikey': effectiveAnonKey,
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

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
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

async function apiRequest<T>(endpoint: string, init: RequestInit = {}, includeContentType: boolean = false): Promise<T> {
  const url = apiUrl(endpoint);
  const baseHeaders = await buildApiHeaders(includeContentType);
  const headers = {
    ...baseHeaders,
    ...(init.headers || {}),
  };

  console.log(`[API ${init.method || 'GET'}] ${url}`, init.body);

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API ${init.method || 'GET'} Error] ${url}:`, error);
    throw error;
  }
}

/**
 * GET 请求
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  }, true);
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * PUT 请求
 */
export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  }, true);
}

interface UploadTarget {
  uploadUrl: string;
  path: string;
}

export async function getUploadTarget(fileName: string, contentType: string): Promise<UploadTarget> {
  return apiPost<UploadTarget>('/upload-url', { fileName, contentType });
}

export async function getImageUrl(path: string): Promise<string> {
  const data = await apiGet<{ url?: string }>(`/image-url/${encodeURIComponent(path)}`);
  if (!data?.url) {
    throw new Error('Failed to create image URL');
  }
  return data.url;
}

export async function uploadFileToSignedUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
}

export async function uploadPlantImage(file: File): Promise<string> {
  const { uploadUrl, path } = await getUploadTarget(file.name, file.type);
  await uploadFileToSignedUrl(uploadUrl, file);
  return getImageUrl(path);
}

export async function getDashboardSummary(): Promise<{
  totalPlants: number;
  onlineDevices: number;
  alerts: number;
}> {
  const [library, plants] = await Promise.all([
    apiGet<any[]>('/library'),
    apiGet<any[]>('/plants?admin_view=true'),
  ]);

  const safeLibrary = Array.isArray(library) ? library : [];
  const safePlants = Array.isArray(plants) ? plants : [];

  return {
    totalPlants: safeLibrary.length,
    onlineDevices: safePlants.length,
    alerts: safePlants.filter((plant: any) => plant?.alert).length,
  };
}

export async function getTimelinePlants(): Promise<any[]> {
  const plants = await apiGet<any[]>('/plants');
  return Array.isArray(plants) ? plants : [];
}

export async function getPlantTimeline(plantId: string): Promise<any[]> {
  const timeline = await apiGet<any>(`/plant-timeline/${plantId}`);
  const items = Array.isArray(timeline)
    ? timeline
    : Array.isArray(timeline?.items)
      ? timeline.items
      : [];

  return items.map((item: any) => ({
    ...item,
    content: item?.content
      || item?.entries?.[0]?.content
      || item?.entries?.[0]?.text
      || item?.details
      || '',
    author: item?.author
      || item?.entries?.[0]?.author
      || item?.userName
      || '系统管理员',
  }));
}

export async function getGrowthDiaryData(): Promise<{
  plants: any[];
  journals: any[];
}> {
  const [plants, journals] = await Promise.all([
    getTimelinePlants(),
    apiGet<any[]>('/all-journals'),
  ]);

  const safePlants = Array.isArray(plants) ? plants : [];
  const safeJournals = Array.isArray(journals) ? journals : [];

  const enhancedJournals = safeJournals.map((journal: any) => {
    const plant = safePlants.find((item: any) => String(item.id) === String(journal.plantId));
    return {
      ...journal,
      plantName: plant?.name || '未知植物',
      plantImage: plant?.imageUrl || plant?.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=100'
    };
  });

  return {
    plants: safePlants,
    journals: enhancedJournals,
  };
}

export async function getJournalDetail(id: string): Promise<any> {
  return apiGet<any>(`/journal-detail/${id}`);
}

export async function getPlantById(plantId: string): Promise<any | null> {
  const plants = await getTimelinePlants();
  return plants.find((plant: any) => String(plant.id) === String(plantId)) || null;
}

export async function toggleJournalFeatured(id: string): Promise<any> {
  return apiPost<any>(`/journal-feature/${id}`);
}

export async function deleteJournal(id: string): Promise<any> {
  return apiDelete<any>(`/journal/${id}`);
}
