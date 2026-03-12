import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

/** 实际使用的 anon key，可用 VITE_SUPABASE_ANON_KEY 覆盖（Supabase 控制台 Project Settings > API 中的 anon public） */
const anonKey =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  publicAnonKey;

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  anonKey
);

export { anonKey as effectiveAnonKey };
