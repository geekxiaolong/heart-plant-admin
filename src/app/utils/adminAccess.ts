import type { User } from '@supabase/supabase-js';

export const ADMIN_EMAILS = ['776427024@qq.com'];

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false;

  const email = user.email?.trim().toLowerCase();
  const role = user.user_metadata?.role;

  return Boolean((email && ADMIN_EMAILS.includes(email)) || role === 'admin');
}
