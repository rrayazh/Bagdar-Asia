import { useLocale, type Locale } from '../i18n/locale';

const languages: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'kk', name: 'Қазақша' },
  { code: 'ru', name: 'Русский' },
];

function Flag({ code }: { code: Locale }) {
  return (
    <svg aria-hidden="true" width="17" height="12" viewBox="0 0 24 16" className="rounded-sm shrink-0">
      {code === 'en' && <>
        <path fill="#23376b" d="M0 0h24v16H0z" />
        <path stroke="#fff" strokeWidth="3.5" d="m0 0 24 16m0-16L0 16" />
        <path stroke="#ce263c" strokeWidth="1.3" d="m0 0 24 16m0-16L0 16" />
        <path stroke="#fff" strokeWidth="5.2" d="M12 0v16M0 8h24" />
        <path stroke="#ce263c" strokeWidth="3" d="M12 0v16M0 8h24" />
      </>}
      {code === 'kk' && <>
        <path fill="#00a9c4" d="M0 0h24v16H0z" />
        <path fill="#ffdc51" d="M2 1h1v14H2z" />
        <circle cx="13" cy="6.5" r="2.3" fill="#ffdc51" />
        <path fill="none" stroke="#ffdc51" strokeWidth=".75" d="M13 2.6v1m0 5.8v1m-3.9-3.9h1m5.8 0h1m-6.7-2.7.7.7m4.2 4.2.7.7m0-5.6-.7.7m-4.2 4.2-.7.7M7.5 10c3 2.5 4.5 1.2 5.5 2.7 1-1.5 2.5-.2 5.5-2.7" />
      </>}
      {code === 'ru' && <>
        <path fill="#fff" d="M0 0h24v5.34H0z" />
        <path fill="#244aa5" d="M0 5.33h24v5.34H0z" />
        <path fill="#d52b39" d="M0 10.66h24V16H0z" />
      </>}
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const active = languages.find(language => language.code === locale)!;
  return (
    <details className="relative">
      <summary aria-label={t('Language')} className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-700 bg-[#161B22] px-2.5 text-xs font-bold text-white list-none [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
        <Flag code={active.code} />
        <span className="uppercase">{active.code}</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 min-w-36 rounded-xl border border-gray-700 bg-[#161B22] p-1 shadow-xl">
        {languages.map(({ code, name }) => (
          <button key={code} type="button" lang={code} aria-pressed={code === locale}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-gray-200 hover:bg-white/10 aria-pressed:bg-emerald-400/15 aria-pressed:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            onClick={event => {
              setLocale(code);
              const disclosure = event.currentTarget.closest('details');
              if (disclosure) {
                disclosure.open = false;
                disclosure.querySelector('summary')?.focus();
              }
            }}>
            <Flag code={code} /> {name}
          </button>
        ))}
      </div>
    </details>
  );
}
