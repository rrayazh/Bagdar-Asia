import { supabase } from './supabase';
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

export async function loadApplicantProfile(userId: string): Promise<ApplicantProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('gpa,sat,ielts,major,target_intake,target_countries,checklist')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    gpa: data.gpa || '',
    sat: data.sat || '',
    ielts: data.ielts || '',
    major: data.major || '',
    targetIntake: data.target_intake || '',
    targetCountries: data.target_countries || [],
    checklist: (data.checklist as Record<string, boolean>) || {},
  };
}

export async function saveApplicantProfile(userId: string, profile: ApplicantProfileData) {
  const { error } = await supabase.from('profiles').update({
    gpa: profile.gpa,
    sat: profile.sat,
    ielts: profile.ielts,
    major: profile.major,
    target_intake: profile.targetIntake,
    target_countries: profile.targetCountries,
    checklist: profile.checklist,
  }).eq('id', userId);
  if (error) throw error;
}

export async function loadPlannerTasks(userId: string): Promise<PlannerTask[]> {
  const { data, error } = await supabase.from('planner_tasks')
    .select('id,category,label,done')
    .eq('user_id', userId)
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data || []).map(task => ({ id: task.id, cat: task.category, label: task.label, done: task.done }));
}

export async function createPlannerTask(userId: string, task: Omit<PlannerTask, 'id'>): Promise<PlannerTask> {
  const { data, error } = await supabase.from('planner_tasks').insert({
    user_id: userId,
    category: task.cat,
    label: task.label,
    done: task.done,
  }).select('id,category,label,done').single();
  if (error) throw error;
  return { id: data.id, cat: data.category, label: data.label, done: data.done };
}

export async function updatePlannerTask(userId: string, taskId: string, done: boolean) {
  const { error } = await supabase.from('planner_tasks').update({ done }).eq('id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function deletePlannerTask(userId: string, taskId: string) {
  const { error } = await supabase.from('planner_tasks').delete().eq('id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function loadDeadlineReminders(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('deadline_reminders').select('deadline_id').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(item => item.deadline_id);
}

export async function setDeadlineReminder(userId: string, deadlineId: string, enabled: boolean) {
  const query = enabled
    ? supabase.from('deadline_reminders').upsert({ user_id: userId, deadline_id: deadlineId })
    : supabase.from('deadline_reminders').delete().eq('user_id', userId).eq('deadline_id', deadlineId);
  const { error } = await query;
  if (error) throw error;
}

export async function loadSavedUniversities(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('saved_universities').select('university_id').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(item => item.university_id);
}

export async function setUniversitySaved(userId: string, universityId: string, saved: boolean) {
  const query = saved
    ? supabase.from('saved_universities').upsert({ user_id: userId, university_id: universityId })
    : supabase.from('saved_universities').delete().eq('user_id', userId).eq('university_id', universityId);
  const { error } = await query;
  if (error) throw error;
}

export async function loadApplications(userId: string): Promise<UniversityApplication[]> {
  const { data, error } = await supabase.from('applications')
    .select('id,university_id,status,notes')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(item => ({
    id: item.id,
    universityId: item.university_id,
    status: item.status as ApplicationStatus,
    notes: item.notes || '',
  }));
}

export async function upsertApplication(userId: string, universityId: string, status: ApplicationStatus = 'shortlisted') {
  const { data, error } = await supabase.from('applications').upsert({
    user_id: userId,
    university_id: universityId,
    status,
  }, { onConflict: 'user_id,university_id' }).select('id,university_id,status,notes').single();
  if (error) throw error;
  return { id: data.id, universityId: data.university_id, status: data.status as ApplicationStatus, notes: data.notes || '' };
}

export async function updateApplication(userId: string, applicationId: string, changes: { status?: ApplicationStatus; notes?: string }) {
  const { error } = await supabase.from('applications').update(changes).eq('id', applicationId).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteApplication(userId: string, applicationId: string) {
  const { error } = await supabase.from('applications').delete().eq('id', applicationId).eq('user_id', userId);
  if (error) throw error;
}
