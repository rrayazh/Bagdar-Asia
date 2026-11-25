import type { University } from '../types';
import { translate, type Locale } from './locale';

export function essayFacts(university: University, locale: Locale) {
  if (locale === 'en') return university.essayFacts;
  const t = (text: string) => translate(locale, text);
  const { name, ranking: rank, admissionRequirements, alumni } = university;
  const skill = t(admissionRequirements.valuedSkills);
  return [
    translate(locale, 'Ranked #{rank} globally, {name} specifically prioritizes {skill} in international candidates.', { rank, name, skill }),
    translate(locale, 'Successful applicants usually exceed the {test} threshold and show deep engagement with {skill}.', { test: t(admissionRequirements.sat), skill }),
    translate(locale, 'Join a legacy of excellence alongside alumni like {first} and {second}.', { first: t(alumni[0]), second: t(alumni[1]) }),
  ];
}

export const localizeCost = (value: string, locale: Locale) =>
  value.replace(/\/ yr|\/ month|\/ mo\b|Full Scholarship|per meal/g, unit => translate(locale, unit));

export function monthlyLivingCost(costs: University['costs'], locale: Locale) {
  const bounds = [costs.food, costs.transport].map(value =>
    [...value.matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map(match => Number(match[1].replaceAll(',', ''))));
  if (bounds.some(numbers => numbers.length !== 2 || numbers.some(number => !Number.isFinite(number)))) return '—';
  const dollars = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return dollars.format(bounds[0][0] + bounds[1][0]) + '–' +
    dollars.format(bounds[0][1] + bounds[1][1]) + translate(locale, '/mo');
}
