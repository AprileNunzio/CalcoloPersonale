import { useCallback, useEffect, useState } from 'react';
import { call } from '../../shared/api';
import { flush } from '../autosave/store';
import { OtaPhase, OtaStatus } from './types';

export function useOta() {
  const [phase, setPhase] = useState<OtaPhase>('idle');
  const [status, setStatus] = useState<OtaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    // If running in development mode (e.g. localhost), do not trigger live OTA update prompts
    const isDev =
      Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

    if (isDev) {
      setPhase('idle');
      return;
    }

    setPhase('checking');
    setError(null);
    try {
      const res = await call<OtaStatus>('ota_check');
      setStatus(res);
      if (res.hasUpdate && res.latestVersion) {
        const dismissed = sessionStorage.getItem('ota_dismissed_version');
        if (dismissed === res.latestVersion) {
          setPhase('idle');
          return;
        }
        setPhase('ready');
      } else {
        setPhase('idle');
      }
    } catch (e) {
      setError(typeof e === 'string' ? e : 'error');
      setPhase('error');
    }
  }, []);

  const apply = useCallback(async () => {
    setPhase('applying');
    setError(null);
    try {
      await flush();
      const applied = await call<boolean>('ota_apply');
      if (applied) {
        window.location.reload();
      } else {
        setPhase('idle');
      }
    } catch (e) {
      setError(typeof e === 'string' ? e : 'error');
      setPhase('error');
    }
  }, []);

  const dismiss = useCallback(() => {
    if (status?.latestVersion) {
      try {
        sessionStorage.setItem('ota_dismissed_version', status.latestVersion);
      } catch {
        // Ignore storage errors
      }
    }
    setPhase('idle');
  }, [status?.latestVersion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void check();
    }, 3000);
    return () => clearTimeout(timer);
  }, [check]);

  return { phase, status, error, check, apply, dismiss };
}
