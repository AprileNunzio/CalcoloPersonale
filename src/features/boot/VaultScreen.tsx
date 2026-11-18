import { useState } from 'react';
import {
  BriefcaseBusiness,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  HardDrive,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="vault-screen" data-theme="vault">
      <div className="vault-center-wrapper">
        <div className="vault-layout">
          <div className="vault-hero">
            <div className="vault-brand">
              <div className="vault-brand-icon">
                <BriefcaseBusiness size={22} />
              </div>
              <span className="vault-brand-name">{t('app')}</span>
            </div>

            <span className="eyebrow">{t('secure')}</span>
            <h1>{t('vaultTitle')}</h1>
            <p className="vault-hero-desc">{t('subtitle')}</p>

            <div className="vault-features-list">
              <div className="vault-feature-item">
                <div className="feature-icon-box">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <strong>Crittografia Hardware AES-256-GCM</strong>
                  <p>Derivazione chiavi Argon2id con cifratura locale zero-trust</p>
                </div>
              </div>

              <div className="vault-feature-item">
                <div className="feature-icon-box">
                  <HardDrive size={16} />
                </div>
                <div>
                  <strong>100% Locale &amp; Conforme GDPR</strong>
                  <p>Nessun dato viene inviato a server cloud o terze parti</p>
                </div>
              </div>

              <div className="vault-feature-item">
                <div className="feature-icon-box">
                  <Sparkles size={16} />
                </div>
                <div>
                  <strong>Calcolo Graduatorie &amp; Ricostruzione Carriera</strong>
                  <p>Motore normativo aggiornato al CCNL Istruzione e Ricerca</p>
                </div>
              </div>
            </div>
          </div>

          <form
            className="vault-form-card"
            onSubmit={e => {
              e.preventDefault();
              onUnlock(password);
              setPassword('');
            }}
          >
            <div className="vault-form-header">
              <div className="vault-lock-badge">
                <LockKeyhole size={24} />
              </div>
              <div>
                <h2>{t('unlock')}</h2>
                <p>{t('vaultHelp')}</p>
              </div>
            </div>

            {error && (
              <div role="alert" className="vault-alert error">
                <AlertCircle size={16} />
                <span>{t(error)}</span>
              </div>
            )}

            {notice && (
              <div role="status" className="vault-alert notice">
                <ShieldCheck size={16} />
                <span>{t(notice)}</span>
              </div>
            )}

            <div className="vault-input-group">
              <label htmlFor="vault-password-input" className="vault-input-label">
                {t('password')}
              </label>
              <div className="vault-input-wrap">
                <input
                  id="vault-password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  minLength={12}
                  maxLength={1024}
                  required
                  autoFocus
                  placeholder="Password dell'archivio (min. 12 caratteri)..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="vault-input"
                />
                <button
                  type="button"
                  className="vault-eye-btn"
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small className="vault-input-hint">
                Minimo 12 caratteri. La password non è recuperabile in caso di smarrimento.
              </small>
            </div>

            <button type="submit" className="vault-submit-btn" disabled={busy || password.length < 12}>
              <span>{t(busy ? 'loading' : 'unlock')}</span>
              <ArrowRight size={18} />
            </button>

            <div className="vault-card-footer">
              <ShieldCheck size={14} className="footer-shield-icon" />
              <span>Protezione conforme standard NIST &amp; GDPR</span>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
