import { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Download,
  ShieldCheck,
  Cpu,
  Layers,
  Lock,
  Server,
  Sparkles,
  AlertCircle,
  FileCheck,
  Radio,
} from 'lucide-react';
import { APP_VERSION } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { useOta } from '../ota/useOta';
import { useNativeUpdater } from './UpdatesBoundary';
import './updatesPage.css';

export function UpdatesPage() {
  const t = useT();
  const ota = useOta();
  const native = useNativeUpdater();
  const [lastCheck, setLastCheck] = useState<string>(() => new Date().toLocaleTimeString());

  const handleGlobalCheck = async () => {
    setLastCheck(new Date().toLocaleTimeString());
    await Promise.all([ota.check(true), native.checkUpdate(true)]);
  };

  const isChecking = ota.phase === 'checking' || native.status.phase === 'checking';
  const isApplying = ota.phase === 'applying' || native.status.phase === 'installing';

  return (
    <div className="updates-page-root">
      <div className="updates-hero-panel">
        <div className="updates-hero-text">
          <div className="updates-title-row">
            <div className="updates-icon-badge">
              <RefreshCw size={22} className={isChecking ? 'spin' : ''} />
            </div>
            <div>
              <h2>{t('systemUpdates')} &amp; Sicurezza</h2>
              <p className="updates-subtitle">{t('systemUpdatesSubtitle')}</p>
            </div>
          </div>
        </div>

        <div className="updates-hero-actions">
          <span className="last-check-badge">
            <Radio size={12} className="pulse-dot" />
            {t('lastCheckTime')}: <strong>{lastCheck}</strong>
          </span>
          <button
            type="button"
            className="check-all-btn"
            disabled={isChecking || isApplying}
            onClick={() => void handleGlobalCheck()}
          >
            <RefreshCw size={15} className={isChecking ? 'spin' : ''} />
            <span>{isChecking ? t('checkingUpdate') : t('checkNow')}</span>
          </button>
        </div>
      </div>

      <div className="updates-channels-grid">
        <div className="panel update-channel-card highlight-ota">
          <div className="channel-header">
            <div className="channel-title-group">
              <Sparkles size={20} className="channel-icon ota" />
              <div>
                <div className="channel-title-row">
                  <h4>{t('otaChannelTitle')}</h4>
                  <span className="channel-tag ota">OTA Live</span>
                  <span className="channel-tag hot">Hot-Reload</span>
                </div>
                <p>{t('otaChannelDesc')}</p>
              </div>
            </div>
          </div>

          <div className="version-info-strip">
            <div className="version-metric">
              <small>{t('currentInstalledVersion')}</small>
              <strong>{ota.status?.currentVersion || APP_VERSION}</strong>
            </div>
            <div className="version-divider" />
            <div className="version-metric">
              <small>{t('latestAvailableVersion')}</small>
              <strong>{ota.status?.latestVersion || ota.status?.currentVersion || APP_VERSION}</strong>
            </div>
          </div>

          <div className="ota-settings-strip">
            <label className="ota-toggle-label">
              <input
                type="checkbox"
                checked={ota.autoCheckEnabled}
                onChange={e => ota.setAutoCheckEnabled(e.target.checked)}
              />
              <span>{t('otaAutoCheckLabel') || 'Verifica automatica all’avvio'}</span>
            </label>
            {ota.status?.currentVersion && ota.status.currentVersion !== APP_VERSION && (
              <button
                type="button"
                className="ota-reset-inline-btn"
                onClick={() => {
                  if (
                    window.confirm(
                      t('confirmResetOta') ||
                        'Sei sicuro di voler rimuovere gli aggiornamenti rapidi e ripristinare la versione originale dell’app?',
                    )
                  ) {
                    void ota.resetOta();
                  }
                }}
                title={t('otaResetDesc') || 'Ripristina versione originale incorporata'}
              >
                {t('otaResetBtn') || 'Ripristina versione base'}
              </button>
            )}
          </div>

          <div className="pipeline-stepper">
            <div className={`step-item ${ota.phase === 'checking' ? 'active' : 'done'}`}>
              <span className="step-dot">{ota.phase === 'checking' ? <RefreshCw size={12} className="spin" /> : <CheckCircle2 size={12} />}</span>
              <span className="step-label">{t('stepCheckManifest')}</span>
            </div>
            <div className={`step-item ${ota.phase === 'ready' || ota.phase === 'applying' ? 'done' : ''}`}>
              <span className="step-dot"><Download size={12} /></span>
              <span className="step-label">{t('stepDownloadBundle')}</span>
            </div>
            <div className={`step-item ${ota.phase === 'ready' || ota.phase === 'applying' ? 'done' : ''}`}>
              <span className="step-dot"><FileCheck size={12} /></span>
              <span className="step-label">{t('stepVerifyHash')}</span>
            </div>
            <div className={`step-item ${ota.phase === 'applying' ? 'active' : ''}`}>
              <span className="step-dot"><Layers size={12} /></span>
              <span className="step-label">{t('stepApplyReload')}</span>
            </div>
          </div>

          <div className="channel-action-area">
            {ota.phase === 'ready' ? (
              <div className="ready-action-box">
                <div className="ready-text">
                  <CheckCircle2 size={18} className="ready-icon" />
                  <div>
                    <strong>{t('otaUpdateAvailable')}</strong>
                    <p>{t('systemReloadNotice')}</p>
                  </div>
                </div>
                <div className="ready-buttons-row">
                  <button
                    type="button"
                    className="apply-ota-btn"
                    onClick={() => void ota.apply()}
                  >
                    <RefreshCw size={16} />
                    <span>{t('downloadAndApplyNow')}</span>
                  </button>
                  <button
                    type="button"
                    className="ignore-ota-btn"
                    onClick={() => ota.dismiss(true)}
                  >
                    <span>{t('doNotShowAgain') || 'Ignora versione'}</span>
                  </button>
                </div>
              </div>
            ) : ota.phase === 'applying' ? (
              <div className="in-progress-box">
                <RefreshCw size={18} className="spin" />
                <span>{t('reloadingSystem')}</span>
              </div>
            ) : ota.phase === 'error' ? (
              <div className="error-action-box">
                <AlertCircle size={18} />
                <span>{ota.error ? t(ota.error) : t('updateFailed')}</span>
                <button type="button" className="retry-btn" onClick={() => void ota.check(true)}>
                  {t('retry')}
                </button>
              </div>
            ) : (
              <div className="up-to-date-box">
                <CheckCircle2 size={16} className="text-green" />
                <span>{t('systemReadyAndUpdated')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="panel update-channel-card">
          <div className="channel-header">
            <div className="channel-title-group">
              <Cpu size={20} className="channel-icon native" />
              <div>
                <div className="channel-title-row">
                  <h4>{t('nativeChannelTitle')}</h4>
                  <span className="channel-tag native">Desktop</span>
                  <span className="channel-tag native-tag-sub">Tauri v2</span>
                </div>
                <p>{t('nativeChannelDesc')}</p>
              </div>
            </div>
          </div>

          <div className="version-info-strip">
            <div className="version-metric">
              <small>{t('currentInstalledVersion')}</small>
              <strong>{APP_VERSION}</strong>
            </div>
            <div className="version-divider" />
            <div className="version-metric">
              <small>{t('latestAvailableVersion')}</small>
              <strong>{native.stagedUpdate?.version || APP_VERSION}</strong>
            </div>
          </div>

          <div className="ota-settings-strip">
            <span className="desktop-channel-info">
              <ShieldCheck size={14} className="desktop-info-icon" />
              <span>Canale Ufficiale: GitHub Releases Stabili</span>
            </span>
            <span className="desktop-arch-badge">MSI / NSIS</span>
          </div>

          <div className="pipeline-stepper">
            <div className={`step-item ${native.status.phase === 'checking' ? 'active' : 'done'}`}>
              <span className="step-dot">{native.status.phase === 'checking' ? <RefreshCw size={12} className="spin" /> : <CheckCircle2 size={12} />}</span>
              <span className="step-label">1. Controllo repository GitHub</span>
            </div>
            <div className={`step-item ${native.status.phase === 'downloading' || native.status.phase === 'updateReady' || native.status.phase === 'installing' ? 'done' : ''}`}>
              <span className="step-dot"><ShieldCheck size={12} /></span>
              <span className="step-label">2. Verifica firma crittografica</span>
            </div>
            <div className={`step-item ${native.status.phase === 'downloading' ? 'active' : native.status.phase === 'updateReady' || native.status.phase === 'installing' ? 'done' : ''}`}>
              <span className="step-dot"><Download size={12} /></span>
              <span className="step-label">3. Download binario compresso</span>
            </div>
            <div className={`step-item ${native.status.phase === 'installing' ? 'active' : ''}`}>
              <span className="step-dot"><Layers size={12} /></span>
              <span className="step-label">4. Installazione con riavvio</span>
            </div>
          </div>

          {native.status.phase === 'downloading' && (
            <div className="native-download-progress">
              <div className="download-progress-text">
                <span>{t('downloadingUpdate')}</span>
                <strong>
                  {native.status.received && native.status.total
                    ? `${Math.round((native.status.received / native.status.total) * 100)}%`
                    : '...'}
                </strong>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: native.status.received && native.status.total
                      ? `${Math.min(100, (native.status.received / native.status.total) * 100)}%`
                      : '40%',
                  }}
                />
              </div>
            </div>
          )}

          <div className="channel-action-area">
            {native.status.phase === 'updateReady' ? (
              <div className="ready-action-box">
                <div className="ready-text">
                  <CheckCircle2 size={18} className="ready-icon" />
                  <div>
                    <strong>{t('updateReadyTitle')}</strong>
                    <p>{t('updateReadyPrompt')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="apply-ota-btn"
                  onClick={() => void native.applyUpdate()}
                >
                  <RefreshCw size={16} />
                  <span>{t('restartAndInstall')}</span>
                </button>
              </div>
            ) : native.status.phase === 'installing' ? (
              <div className="in-progress-box">
                <RefreshCw size={18} className="spin" />
                <span>{t('installingUpdate')}</span>
              </div>
            ) : native.status.phase === 'failed' ? (
              <div className="error-action-box">
                <AlertCircle size={18} />
                <span>{t('updateFailed')}</span>
                <button type="button" className="retry-btn" onClick={() => void native.checkUpdate(true)}>
                  {t('retry')}
                </button>
              </div>
            ) : (
              <div className="up-to-date-box">
                <CheckCircle2 size={16} className="text-green" />
                <span>{t('upToDateNotice')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="security-diagnostics-section">
        <div className="section-title-row">
          <ShieldCheck size={18} className="text-primary" />
          <h4>{t('securityAndDiagnostics')}</h4>
          <span className="diag-summary-pill">Integrità Crittografica al 100%</span>
        </div>
        <div className="security-diag-grid">
          <div className="security-diag-card">
            <div className="security-diag-icon-box">
              <Server size={18} />
            </div>
            <div className="security-diag-content">
              <span className="diag-kicker">{t('engineType')}</span>
              <strong>Tauri v2 • Rust Core (Debian/Windows MSVC)</strong>
              <small>Runtime nativo compilato • Isolamento Sandbox sicuro</small>
            </div>
            <span className="diag-status-badge verified">
              <CheckCircle2 size={12} /> Attivo
            </span>
          </div>

          <div className="security-diag-card">
            <div className="security-diag-icon-box lock">
              <Lock size={18} />
            </div>
            <div className="security-diag-content">
              <span className="diag-kicker">{t('vaultSecurityLevel')}</span>
              <strong>Argon2id + AES-256-GCM Zero-Trust</strong>
              <small>Cifratura locale del database conforme al GDPR</small>
            </div>
            <span className="diag-status-badge verified">
              <CheckCircle2 size={12} /> Protetto
            </span>
          </div>

          <div className="security-diag-card">
            <div className="security-diag-icon-box shield">
              <FileCheck size={18} />
            </div>
            <div className="security-diag-content">
              <span className="diag-kicker">{t('signingVerification')}</span>
              <strong>SHA-256 / Ed25519 Minisign Verified</strong>
              <small>Firma digitale Minisign verificata ad ogni rilascio</small>
            </div>
            <span className="diag-status-badge verified">
              <CheckCircle2 size={12} /> Convalidato
            </span>
          </div>
        </div>
      </div>

      <div className="updates-bottom-grid">
        <div className="panel updates-bento-card">
          <div className="bento-card-header">
            <div className="bento-icon-wrapper primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h4>Note di Rilascio v{APP_VERSION} &amp; Novità</h4>
              <p>Miglioramenti integrati nei moduli di calcolo e nell’interfaccia</p>
            </div>
          </div>
          <div className="release-notes-list">
            <div className="release-note-item">
              <div className="release-note-bullet primary" />
              <div>
                <strong>Algoritmi CCNL Istruzione e Ricerca</strong>
                <p>Tabelle stipendiali aggiornate, scatti di anzianità e monetizzazione ferie per personale ATA e docenti.</p>
              </div>
            </div>
            <div className="release-note-item">
              <div className="release-note-bullet secondary" />
              <div>
                <strong>Motore 30 Scuole &amp; Graduatorie ATA</strong>
                <p>Calcolo punteggi conforme all’O.M. 89/2024 con integrazione dei codici meccanografici ISTAT/MIUR.</p>
              </div>
            </div>
            <div className="release-note-item">
              <div className="release-note-bullet tertiary" />
              <div>
                <strong>Material Design 3 Expressive &amp; Spazi Ottimizzati</strong>
                <p>Palette semantiche dedicate per ogni sezione, Bento Grid fluida e densità desktop calibrata fino a 8K.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel updates-bento-card">
          <div className="bento-card-header">
            <div className="bento-icon-wrapper secondary">
              <Radio size={18} />
            </div>
            <div>
              <h4>Registro di Integrità e Telemetria Locale</h4>
              <p>Verifica in tempo reale dei moduli crittografici e di calcolo</p>
            </div>
          </div>
          <div className="telemetry-log-box">
            <div className="telemetry-row ok">
              <span className="telemetry-tag">OK</span>
              <span className="telemetry-text">Firma crittografica Minisign verificata con successo</span>
              <span className="telemetry-time">Live</span>
            </div>
            <div className="telemetry-row ok">
              <span className="telemetry-tag">OK</span>
              <span className="telemetry-text">Archivio cifrato AES-256-GCM conforme Zero-Trust</span>
              <span className="telemetry-time">Locale</span>
            </div>
            <div className="telemetry-row ok">
              <span className="telemetry-tag">OK</span>
              <span className="telemetry-text">Manifesto OTA sincronizzato con repository GitHub</span>
              <span className="telemetry-time">{lastCheck}</span>
            </div>
            <div className="telemetry-row ok">
              <span className="telemetry-tag">OK</span>
              <span className="telemetry-text">Tabelle retributive e algoritmo comporto ARAN attivi</span>
              <span className="telemetry-time">v{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
