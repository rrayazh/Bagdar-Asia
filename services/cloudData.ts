import { request } from './request';
import type { ApplicationStatus, PlannerTask, UniversityApplication } from '../types';

export interface ApplicantProfileData {
  gpa: string;
  sat: string;
  ielts: string;
  major: string;
  targetIntake: string;
  targetCountries: string[];
  checklist: Record<string, boolean>;
}

const load = <T>(kind: string) => request<T>('/api/data?kind=' + kind);
const write = <T = unknown>(kind: string, action: string, key?: string, value?: unknown) =>
  request<T>('/api/data', 'POST', { kind, action, key, value });

// The server uses the signed-in account to scope all reads and writes.
export const loadApplicantProfile = (_userId: string) => load<ApplicantProfileData | null>('profile');
export const saveApplicantProfile = (_userId: string, profile: ApplicantProfileData) => write('profile', 'save', undefined, profile);
export const loadPlannerTasks = (_userId: string) => load<PlannerTask[]>('planner');
export const createPlannerTask = (_userId: string, task: Omit<PlannerTask, 'id'>) => write<PlannerTask>('planner', 'create', undefined, task);
export const updatePlannerTask = (_userId: string, taskId: string, done: boolean) => write('planner', 'update', taskId, { done });
export const deletePlannerTask = (_userId: string, taskId: string) => write('planner', 'delete', taskId);
export const loadDeadlineReminders = (_userId: string) => load<string[]>('deadline');
export const setDeadlineReminder = (_userId: string, deadlineId: string, enabled: boolean) => write('deadline', enabled ? 'save' : 'delete', deadlineId);
export const loadSavedUniversities = (_userId: string) => load<string[]>('university');
export const setUniversitySaved = (_userId: string, universityId: string, saved: boolean) => write('university', saved ? 'save' : 'delete', universityId);
export const loadApplications = (_userId: string) => load<UniversityApplication[]>('application');
export const upsertApplication = (_userId: string, universityId: string, status: ApplicationStatus = 'shortlisted') =>
  write<UniversityApplication>('application', 'save', universityId, { status });
export const updateApplication = (_userId: string, applicationId: string, changes: { status?: ApplicationStatus; notes?: string }) =>
  write('application', 'update', applicationId, changes);
export const deleteApplication = (_userId: string, applicationId: string) => write('application', 'delete', applicationId);
