import { apiDelete, apiGet, getApiErrorMessage } from './api';
import { unsupportedMessage } from './backendCapabilities';

export interface PlantLibraryItem {
  id: string;
  name: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  imageUrl: string;
  scene: string;
  status: string;
  tags: string[];
  adoptCount: number;
  addedDate: string;
  habits: string;
  lifespan: string;
  emotionalMeaning: string;
  dimensions?: Record<string, number>;
}

export interface ClaimedPlantItem {
  id: string;
  name: string;
  type: string;
  health: number;
  temp: number;
  humidity: number;
  image: string;
  owners: string[];
  days?: number;
  alert: boolean;
  created_at?: string;
  adoptedAt?: string;
}

export async function fetchPlantLibrary(): Promise<PlantLibraryItem[]> {
  const data = await apiGet<PlantLibraryItem[]>('/library');
  return Array.isArray(data) ? data : [];
}

export async function fetchClaimedPlants(): Promise<ClaimedPlantItem[]> {
  const data = await apiGet<ClaimedPlantItem[]>('/plants?admin_view=true');
  return Array.isArray(data) ? data : [];
}

export function getPlantRequestErrorMessage(error: unknown, fallback: string) {
  const message = getApiErrorMessage(error, fallback);

  if (message.includes('Invalid JWT') || message.includes('JWT') && message.toLowerCase().includes('invalid')) {
    return '登录已过期或凭证无效，请重新登录后再试。';
  }

  if (message.includes('Unauthorized')) {
    return '登录状态已失效，请重新登录后再试。';
  }

  if (message.includes('Forbidden')) {
    return '当前账号没有访问该页面数据的权限。';
  }

  return message;
}

export async function deletePlantLibraryItem(id: string): Promise<void> {
  const result = await apiDelete<{ success?: boolean; error?: string }>(`/library/${id}`);
  if (result?.success === false) {
    throw new Error(result.error || '删除失败');
  }
}

export function getDeletePlantErrorMessage(error: unknown) {
  const message = getApiErrorMessage(error, '');

  if (message.includes('KV delete is not available')) {
    return '当前运行环境暂未开启删除能力，请稍后重试或检查 KV 删除支持。';
  }
  if (message.includes('Unauthorized')) {
    return '登录状态已失效，请重新登录后再试。';
  }
  if (message.includes('Forbidden')) {
    return '当前账号没有删除植物库的权限。';
  }
  if (message.includes('not found')) {
    return '该植物已不存在，列表将自动刷新。';
  }

  return `删除失败：${message || unsupportedMessage('libraryDelete')}`;
}
