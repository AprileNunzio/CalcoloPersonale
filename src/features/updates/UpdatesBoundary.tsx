import { ReactNode, useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ArrowUpRight, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { flush } from '../autosave/store';
import { useT } from '../../shared/i18n';
import './styles.css';

type Status = {
  phase: 'idle' | 'checking' | 'downloading' | 'updateReady' | 'installing' | 'upToDate' | 'failed';
  received?: number;
  total?: number;
  message?: string;
};

const listeners = new Set<(status: Status) => void>();
let current: Status = { phase: 'idle' };
let stagedUpdate: Update | null = null;
let runningCheck = false;
let autoChecked = false;

function publish(status: Status) {
  current = status;
  listeners.forEach(listener => listener(status));
}

// Background silent updater
export async function backgroundCheckUpdate(isManual = false) {
  if (!isTauri() || runningCheck) return;
  runningCheck = true;
  if (isManual) publish({ phase: 'checking' });

  try {
    const update = await check({ timeout: 15000 });
    if (!update) {
      if (isManual) {
        publish({ phase: 'upToDate' });
        setTimeout(() => publish({ phase: 'idle' }), 4000);
      } else {
        publish({ phase: 'idle' });
      }
      return;
    }

    // Update found! Download in background silently
    publish({ phase: 'downloading', received: 0 });
    await update.download(event => {
      if (event.event === 'Started') {
        publish({ phase: 'downloading', received: 0, total: event.data.contentLength });
      } else if (event.event === 'Progress') {
        publish({
          phase: 'downloading',
          received: (current.received || 0) + event.data.chunkLength,
          total: current.total,
        });
      }
    });

    // Successfully downloaded! Ready for user restart
    stagedUpdate = update;
    publish({ phase: 'updateReady' });
  } catch (err) {
    if (isManual) {
      publish({ phase: 'failed', message: typeof err === 'string' ? err : 'updateFailed' });
      setTimeout(() => publish({ phase: 'idle' }), 5000);
    } else {
      publish({ phase: 'idle' });
    }
  } finally {
    runningCheck = false;
  }
}

export function requestUpdate() {
  if (stagedUpdate) {
    publish({ phase: 'updateReady' });
    return;
  }
  void backgroundCheckUpdate(true);
}

export async function applyUpdateAndRestart() {
  if (!stagedUpdate) return;
  try {
    publish({ phase: 'installing' });
    await flush();
    await stagedUpdate.install();
    await relaunch();
  } catch {
    publish({ phase: 'failed' });
  }
}

export function UpdatesBoundary({ children }: { children: ReactNode }) {
  const t = useT();
  const [status, setStatus] = useState<Status>(current);

  useEffect(() => {
    listeners.add(setStatus);
    if (isTauri() && !autoChecked) {
      autoChecked = true;
      // Start background update check silently after short delay
      const timer = setTimeout(() => {
        void backgroundCheckUpdate(false);
      }, 2500);
      return () => {
        clearTimeout(timer);
        listeners.delete(setStatus);
      };
    }
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return (
    <>
      {children}

      {/* Non-modal single-page update notification bar */}
      {status.phase === 'updateReady' && (
        <aside className="update-banner" role="status" aria-live="polite">
          <div className="update-banner-content">
            <CheckCircle2 size={20} className="update-icon success" />
            <div>
              <strong>{t('updateReadyTitle')}</strong>
              <p>{t('updateReadyPrompt')}</p>
            </div>
          </div>
          <div className="update-banner-actions">
            <button className="primary-update" onClick={() => void applyUpdateAndRestart()}>
              <RefreshCw size={15} />
              {t('restartAndInstall')}
            </button>
            <button
              className="secondary-update"
              onClick={() => publish({ phase: 'idle' })}
              aria-label={t('later')}
            >
              {t('later')}
            </button>
          </div>
        </aside>
      )}

      {/* Temporary toast for manual check notifications */}
      {status.phase === 'checking' && (
        <div className="update-toast" role="status">
          <RefreshCw size={15} className="spin" />
          <span>{t('checkingUpdate')}...</span>
        </div>
      )}

      {status.phase === 'upToDate' && (
        <div className="update-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{t('upToDateNotice')}</span>
        </div>
      )}

      {status.phase === 'installing' && (
        <div className="update-toast" role="status">
          <RefreshCw size={15} className="spin" />
          <span>{t('installingUpdate')}...</span>
        </div>
      )}
    </>
  );
}
