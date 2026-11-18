import { useState } from 'react';
import { BriefcaseBusiness, LockKeyhole, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useT } from '../../shared/i18n';

export function VaultScreen({
  onUnlock,
  busy,
  error,
  notice,
}: {
  locale?: string;
  setLocale?: (l: any) => void;
  onUnlock: (password: string) => void;
  busy: boolean;
  error?: string;
  notice?: string;
}) {
  const t = useT();
  const [password, setPassword] = useState('');

  return (
    <main className="vault-screen" data-theme="vault">
      <div className="vault-brand">
        <div className="icon-badge circular">
          <BriefcaseBusiness size={24} />
        </div>
        <strong>{t('app')}</strong>
      </div>
      <div className="vault-layout">
        <div className="vault-hero">
          <span className="eyebrow">{t('secure')}</span>
          <h1>{t('vaultTitle')}</h1>
          <p>{t('subtitle')}</p>
          <div className="privacy">
            <div className="icon-badge circular secondary" style={{ width: 28, height: 28 }}>
              <ShieldCheck size={16} />
            </div>
            <span>{t('privacy')}</span>
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
          <div className="icon-badge circular" style={{ marginBottom: 16 }}>
            <LockKeyhole size={24} />
          </div>
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
          <button type="submit" disabled={busy}>
            <span>{t(busy ? 'loading' : 'unlock')}</span>
            <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
