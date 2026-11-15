import { ReactNode, useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { flush } from '../autosave/store';
import { useT } from '../../shared/i18n';
import './styles.css';

type Status = { phase: string; received: number; total?: number };
const listeners = new Set<(status: Status) => void>();
let current: Status = { phase: 'checkingUpdate', received: 0 };
let operation: Promise<void> | undefined;
let started = false;

function publish(status: Status) {
  current = status;
  listeners.forEach(listener => listener(status));
}

async function performUpdate() {
  publish({ phase: 'checkingUpdate', received: 0 });
  try {
    await flush();
    const update = await check({ timeout: 12000 });
    if (!update) {
      publish({ phase: 'idle', received: 0 });
      return;
    }
    try {
      publish({ phase: 'downloadingUpdate', received: 0 });
      await update.download(event => {
        if (event.event === 'Started') {
          publish({ phase: 'downloadingUpdate', received: 0, total: event.data.contentLength });
        } else if (event.event === 'Progress') {
          publish({ ...current, received: current.received + event.data.chunkLength });
        }
      });
      await flush();
      publish({ ...current, phase: 'installingUpdate' });
      await update.install();
      publish({ ...current, phase: 'restartingUpdate' });
      await relaunch();
    } finally {
      await update.close();
    }
  } catch {
    publish({ phase: 'updateFailed', received: 0 });
  }
}

export function requestUpdate() {
  if (!isTauri() || operation) return;
  operation = performUpdate().finally(() => { operation = undefined; });
}

export function UpdatesBoundary({ children }: { children: ReactNode }) {
  const t = useT();
  const [status, setStatus] = useState(current);
  useEffect(() => {
    listeners.add(setStatus);
    if (!isTauri()) publish({ phase: 'idle', received: 0 });
    else if (!started) { started = true; requestUpdate(); }
    return () => { listeners.delete(setStatus); };
  }, []);
  const blocked = status.phase !== 'idle';
  return <>
    <fieldset className="application-boundary" disabled={blocked} aria-hidden={blocked}>
      {children}
    </fieldset>
    {blocked && <div className="update-overlay" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <section className="panel update-panel">
        <h2 id="update-title">{t(status.phase)}</h2>
        {status.phase === 'downloadingUpdate' && <progress aria-label={t('downloadingUpdate')} max={status.total} value={status.total ? status.received : undefined}/>}
        <p>{t(status.phase === 'updateFailed' ? 'updateFailureDetails' : 'updateSafety')}</p>
        {status.phase === 'updateFailed' && <div className="actions">
          <button onClick={requestUpdate}>{t('retry')}</button>
          <button className="secondary" onClick={() => publish({ phase: 'idle', received: 0 })}>{t('continueOffline')}</button>
        </div>}
      </section>
    </div>}
  </>;
}
