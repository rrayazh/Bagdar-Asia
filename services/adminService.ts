import type { User } from '../types';
import { request } from './request';

export interface AdminUser extends User {
  lastSignInAt: string | null;
  registrationComplete: boolean;
}
export interface AdminOverview {
  users: AdminUser[];
  stats: { users: number; applications: number; aiRequests: number };
}

export const getAdminOverview = () => request<AdminOverview>('/api/admin');
export const inviteCandidate = (candidate: { name: string; email: string; targetCountry: string }) =>
  request<{ invitation: string }>('/api/admin', 'POST', candidate);
export const deleteCandidate = (userId: string) => request('/api/admin', 'DELETE', { userId });
