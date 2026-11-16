import { useState } from 'react';
import { BriefcaseBusiness, LockKeyhole, ArrowUpRight, ShieldCheck, Languages } from 'lucide-react';
import { Locale, useT } from '../../shared/i18n';

export function VaultScreen({
  locale,
  setLocale,
  onUnlock,
  busy,
  error,
  notice,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onUnlock: (password: string) => void;
  busy: boolean;
  error?: string;
  notice?: string;
}) {
  const t = useT();
  const [password, setPassword] = useState('');

  const language = (
    <button
      type="button"
      className="secondary language"
      aria-label={t('language')}
      onClick={() => {
        const next = locale === 'it' ? 'en' : 'it';
        setLocale(next);
        document.documentElement.lang = next;
      }}
    >
      <Languages size={17} />
      {locale.toUpperCase()}
    </button>
  );

  return (
    <main className="vault-screen">
      <div className="vault-brand">
        <BriefcaseBusiness size={30} />
        {t('app')}
        {language}
      </div>
      <div className="vault-layout">
        <div>
          <span className="eyebrow">{t('secure')}</span>
          <h1>{t('vaultTitle')}</h1>
          <p>{t('subtitle')}</p>
          <div className="privacy">
            <ShieldCheck size={18} />
            {t('privacy')}
          </div>
        </div>
        <form
          className="panel vault-form"
          onSubmit={e => {
            e.preventDefault();
            onUnlock(password);
            setPassword('');
          }}
        >
          <LockKeyhole size={32} />
          <h2>{t('unlock')}</h2>
          <p className="muted">{t('vaultHelp')}</p>
          {error && (
            <div role="alert" className="error">
              {t(error)}
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {t(notice)}
            </div>
          )}
          <label>
            {t('password')}
            <input
              type="password"
              autoComplete="current-password"
              minLength={12}
              maxLength={1024}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy}>
            {t(busy ? 'loading' : 'unlock')}
            <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
