import { Sparkles, RefreshCw, X } from 'lucide-react';
import { useT } from '../../shared/i18n';
import { useOta } from './useOta';
import './styles.css';

export function OtaBanner() {
  const t = useT();
  const { phase, status, apply, dismiss } = useOta();

  if (phase !== 'ready' || !status?.hasUpdate) {
    return null;
  }

  return (
    <aside className="ota-banner" role="status" aria-live="polite">
      <div className="ota-banner-info">
        <Sparkles size={18} className="ota-icon" />
        <div className="ota-text">
          <strong>{t('otaUpdateAvailable')}</strong>
          <p>{t('otaUpdatePrompt')}</p>
        </div>
      </div>
      <div className="ota-actions">
        <button className="ota-btn-primary" onClick={() => void apply()}>
          <RefreshCw size={14} />
          {t('otaReloadNow')}
        </button>
        <button
          className="ota-btn-secondary"
          onClick={dismiss}
          aria-label={t('later')}
        >
          {t('later')}
        </button>
      </div>
    </aside>
  );
}
