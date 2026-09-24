import type { User } from '../types';
import { supabase } from './supabase';

export interface AdminUser extends User {
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

export interface AdminOverview {
  users: AdminUser[];
  stats: { users: number; applications: number; aiRequests: number };
}

const request = async (init?: RequestInit) => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Administrator sign-in is required');
  const response = await fetch('/api/admin', {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Admin request failed');
  return payload;
};

export const getAdminOverview = (): Promise<AdminOverview> => request();

export const inviteCandidate = (candidate: { name: string; email: string; targetCountry: string }) =>
  request({ method: 'POST', body: JSON.stringify(candidate) });

export const deleteCandidate = (userId: string) =>
  request({ method: 'DELETE', body: JSON.stringify({ userId }) });
