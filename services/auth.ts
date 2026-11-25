import type { Locale } from '../i18n/locale';
import type { User } from '../types';
import { request } from './request';

export const currentUser = () => request<User | null>('/api/auth');
export const signOut = () => request('/api/auth', 'DELETE');
export const signIn = (email: string, password: string) => request<User>('/api/auth', 'POST', { action: 'signin', email, password });
export const register = (email: string, password: string, name: string, targetCountry: string, invitation: string | undefined, locale: Locale) =>
  request<{ verificationRequired: true }>('/api/auth', 'POST', { action: 'register', email, password, name, targetCountry, invitation, locale });

export const requestAccountEmail = (action: 'forgot' | 'resend', email: string, locale: Locale) =>
  request('/api/auth', 'POST', { action, email, locale });

export const completeAccountLink = (action: 'verify' | 'reset', token: string, password: string) =>
  request('/api/auth', 'POST', { action, token, password });
