import { Sparkles, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useT } from '../../shared/i18n';
import { useOta } from './useOta';
import './styles.css';

export function OtaBanner() {
  const t = useT();
  const { phase, status, error, apply, dismiss } = useOta();

  if (phase === 'idle' || phase === 'checking' || !status?.hasUpdate) {
    return null;
  }

  const isApplying = phase === 'applying';
  const isError = phase === 'error';

  return (
    <aside className={`ota-banner ${isError ? 'ota-banner-error' : ''}`} role="status" aria-live="polite">
      <div className="ota-banner-info">
        {isApplying ? (
          <RefreshCw size={18} className="ota-icon ota-spin" />
        ) : isError ? (
          <AlertCircle size={18} className="ota-icon ota-error-icon" />
        ) : (
          <Sparkles size={18} className="ota-icon" />
        )}
        <div className="ota-text">
          <strong>
            {isApplying
              ? (t('otaApplying') || 'Aggiornamento in corso...')
              : isError
              ? (t('otaError') || 'Errore durante l’aggiornamento')
              : t('otaUpdateAvailable')}
          </strong>
          <p>
            {isApplying
              ? (t('otaApplyingWait') || 'Scaricamento nuova versione interfaccia in corso...')
              : isError
              ? (error || t('otaFailedPrompt') || 'Non è stato possibile applicare la nuova interfaccia.')
              : t('otaUpdatePrompt')}
          </p>
        </div>
      </div>
      <div className="ota-actions">
        <button
          className="ota-btn-primary"
          disabled={isApplying}
          onClick={() => void apply()}
        >
          <RefreshCw size={14} className={isApplying ? 'ota-spin' : ''} />
          {isApplying
            ? (t('otaApplyingShort') || 'Caricamento...')
            : isError
            ? (t('retry') || 'Riprova')
            : t('otaReloadNow')}
        </button>
        {!isApplying && (
          <button
            className="ota-btn-secondary"
            onClick={dismiss}
            aria-label={t('later')}
          >
            {t('later')}
          </button>
        )}
      </div>
    </aside>
  );
}
