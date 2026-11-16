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
    await Promise.all([ota.check(), native.checkUpdate(true)]);
  };

  const isChecking = ota.phase === 'checking' || native.status.phase === 'checking';
  const isApplying = ota.phase === 'applying' || native.status.phase === 'installing';

  return (
    <div className="updates-page-root">
      <div className="updates-hero-panel">
        <div className="updates-hero-text">
          <div className="updates-title-row">
            <div className="updates-icon-badge">
              <RefreshCw size={24} className={isChecking ? 'spin' : ''} />
            </div>
            <div>
              <h2>{t('systemUpdates')}</h2>
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
                <button
                  type="button"
                  className="apply-ota-btn"
                  onClick={() => void ota.apply()}
                >
                  <RefreshCw size={16} />
                  <span>{t('downloadAndApplyNow')}</span>
                </button>
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
                <button type="button" className="retry-btn" onClick={() => void ota.check()}>
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

      <div className="panel security-diagnostics-card">
        <div className="security-diag-header">
          <ShieldCheck size={18} />
          <h4>{t('securityAndDiagnostics')}</h4>
        </div>
        <div className="security-diag-grid">
          <div className="security-diag-item">
            <Server size={16} />
            <div>
              <small>{t('engineType')}</small>
              <strong>Tauri v2 + Rust Core (Debian/Windows MSVC)</strong>
            </div>
          </div>
          <div className="security-diag-item">
            <Lock size={16} />
            <div>
              <small>{t('vaultSecurityLevel')}</small>
              <strong>Argon2id + AES-256-GCM Zero-Trust</strong>
            </div>
          </div>
          <div className="security-diag-item">
            <FileCheck size={16} />
            <div>
              <small>{t('signingVerification')}</small>
              <strong>SHA-256 / ECDSA Minisign Verified</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
