import { ReactNode, useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { flush } from '../autosave/store';
import { useT } from '../../shared/i18n';
import './styles.css';

export type NativeStatus = {
  phase: 'idle' | 'checking' | 'downloading' | 'updateReady' | 'installing' | 'upToDate' | 'failed';
  received?: number;
  total?: number;
  message?: string;
};

const listeners = new Set<(status: NativeStatus) => void>();
let current: NativeStatus = { phase: 'idle' };
let stagedUpdate: Update | null = null;
let runningCheck = false;
let autoChecked = false;

function publish(status: NativeStatus) {
  current = status;
  listeners.forEach(listener => listener(status));
}

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

export function useNativeUpdater() {
  const [status, setStatus] = useState<NativeStatus>(current);

  useEffect(() => {
    listeners.add(setStatus);
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return {
    status,
    checkUpdate: (isManual = true) => backgroundCheckUpdate(isManual),
    applyUpdate: applyUpdateAndRestart,
    stagedUpdate,
  };
}

export function UpdatesBoundary({ children }: { children: ReactNode }) {
  const t = useT();
  const [status, setStatus] = useState<NativeStatus>(current);

  useEffect(() => {
    listeners.add(setStatus);
    if (isTauri() && !autoChecked) {
      autoChecked = true;
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
