import { toast } from 'sonner';
import { getApiErrorMessage } from './api';
import { unsupportedMessage } from './backendCapabilities';

export type PlantLibraryFlashState = {
  refresh: true;
  source: 'add-plant' | 'edit-plant';
  ts: number;
  flash?: {
    type: 'success';
    message: string;
  };
};

export function buildPlantLibraryFlashState(
  source: 'add-plant' | 'edit-plant',
  message: string,
): PlantLibraryFlashState {
  return {
    refresh: true,
    source,
    ts: Date.now(),
    flash: {
      type: 'success',
      message,
    },
  };
}

export function notifyPlantImageUploadSuccess(message = '图片上传成功') {
  toast.success(message);
}

export function notifyPlantImageUploadError(error: unknown) {
  const message = getApiErrorMessage(error, '');

  if (message.includes('Unauthorized')) {
    toast.error('登录状态已失效，请重新登录后再试。');
    return;
  }

  if (message.includes('Forbidden')) {
    toast.error('当前账号没有上传图片的权限。');
    return;
  }

  toast.error(`图片上传失败：${message || unsupportedMessage('uploadImage')}`);
}

export function notifyPlantSaveError(error: unknown) {
  const message = getApiErrorMessage(error, '请重试');

  if (message.includes('Unauthorized')) {
    toast.error('登录状态已失效，请重新登录后再试。');
    return;
  }

  if (message.includes('Forbidden')) {
    toast.error('当前账号没有保存植物库的权限。');
    return;
  }

  toast.error(`保存失败：${message}`);
}
