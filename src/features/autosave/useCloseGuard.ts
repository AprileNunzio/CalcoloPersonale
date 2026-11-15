import { useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { flush, reportFailure } from './store';

export function useCloseGuard() {
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let remove: (() => void) | undefined;
    void getCurrentWindow().onCloseRequested(async event => {
      event.preventDefault();
      try {
        await flush();
        await getCurrentWindow().destroy();
      } catch {
        reportFailure();
      }
    }).then(unlisten => {
      if (disposed) unlisten();
      else remove = unlisten;
    }).catch(reportFailure);
    return () => { disposed = true; remove?.(); };
  }, []);
}
