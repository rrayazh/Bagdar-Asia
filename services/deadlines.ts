import { UPCOMING_DEADLINES } from '../constants';
import type { Deadline } from '../types';

export const dateOnly = (deadline: Deadline) => !deadline.date.includes('T');
export const universityZone = (deadline: Deadline) => deadline.timeZone || 'Asia/Almaty';

export function upcomingDeadlines(now: number) {
  return UPCOMING_DEADLINES.filter(deadline => {
    if (!dateOnly(deadline)) return Date.parse(deadline.date) > now;
    const localDay = new Intl.DateTimeFormat('sv-SE', {
      timeZone: universityZone(deadline), dateStyle: 'short',
    }).format(now);
    return deadline.date >= localDay;
  }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function formatDeadline(deadline: Deadline, locale: string) {
  return new Intl.DateTimeFormat(locale, dateOnly(deadline)
    ? { dateStyle: 'long', timeZone: 'UTC' }
    : { dateStyle: 'long', timeStyle: 'short', timeZone: universityZone(deadline) }
  ).format(new Date(deadline.date));
}
