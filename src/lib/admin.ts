import { useAuth } from '@/contexts/AuthContext';

export const ADMIN_EMAILS = ['mouslim89@gmail.com'];

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
