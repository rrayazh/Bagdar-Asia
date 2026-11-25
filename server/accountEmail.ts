import { HttpError } from './backend';

export function emailSettings() {
  const { RESEND_API_KEY: key, AUTH_EMAIL_FROM: from, APP_ORIGIN: origin } = process.env;
  if (!key || !from || !origin) throw new HttpError(503, 'Account email is not configured');
  let url: URL;
  try { url = new URL(origin); } catch { throw new HttpError(503, 'Account email is not configured'); }
  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.origin !== origin || (url.protocol !== 'https:' && !localHttp)) {
    throw new HttpError(503, 'Account email is not configured');
  }
  return { key, from, origin };
}

const copy = {
  en: { verify: 'Verify your Bagdar Asia email', reset: 'Reset your Bagdar Asia password', ignore: 'You can ignore this email if you did not request it.' },
  kk: { verify: 'Bagdar Asia поштаңызды растаңыз', reset: 'Bagdar Asia құпиясөзін қалпына келтіріңіз', ignore: 'Бұл әрекетті сұрамаған болсаңыз, хатты елемеңіз.' },
  ru: { verify: 'Подтвердите почту Bagdar Asia', reset: 'Сбросьте пароль Bagdar Asia', ignore: 'Если вы не запрашивали это действие, проигнорируйте письмо.' },
} as const;

export async function sendAccountEmail(to: string, kind: 'verify' | 'reset', token: string, locale: unknown) {
  const { key, from, origin } = emailSettings();
  const language = locale === 'kk' || locale === 'ru' ? locale : 'en';
  const subject = copy[language][kind];
  const link = origin + '/#' + kind + '=' + encodeURIComponent(token);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text: subject + '\n\n' + link + '\n\n' + copy[language].ignore }),
    });
    if (!response.ok) throw new Error('Email delivery failed');
  } catch {
    throw new HttpError(503, 'Account email could not be sent');
  }
}
