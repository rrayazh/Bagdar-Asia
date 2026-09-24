import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '../types';

export const mapAuthUser = (user: SupabaseUser): User => ({
  id: user.id,
  name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'),
  email: user.email || '',
  targetCountry: String(user.user_metadata?.target_country || 'Not selected'),
  registeredAt: user.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  role: user.app_metadata?.role === 'admin' ? 'admin' : 'user',
});
