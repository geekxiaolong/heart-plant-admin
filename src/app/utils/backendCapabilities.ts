export const backendCapabilities = {
  libraryDelete: true,
  uploadImage: true,
  journalFeature: true,
  journalDelete: true,
} as const;

export function unsupportedMessage(feature: keyof typeof backendCapabilities, fallback?: string) {
  const defaults: Record<keyof typeof backendCapabilities, string> = {
    libraryDelete: '当前后端还没有提供植物库删除接口。',
    uploadImage: '当前后端还没有提供图片上传/取回地址接口。',
    journalFeature: '当前后端还没有提供日记精选接口。',
    journalDelete: '当前后端还没有提供日记删除接口。',
  };

  return fallback || defaults[feature];
}
