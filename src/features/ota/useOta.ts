import { useCallback, useEffect, useState } from 'react';
import { call } from '../../shared/api';
import { flush } from '../autosave/store';
import { OtaPhase, OtaStatus } from './types';

const DISMISSED_KEY = 'ota_dismissed_version';
const AUTO_CHECK_KEY = 'ota_auto_check';

export function useOta() {
  const [phase, setPhase] = useState<OtaPhase>('idle');
  const [status, setStatus] = useState<OtaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCheckEnabled, setAutoCheckState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_CHECK_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const setAutoCheckEnabled = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem(AUTO_CHECK_KEY, String(enabled));
    } catch {
      // Ignore storage errors
    }
    setAutoCheckState(enabled);
  }, []);

  const check = useCallback(async (force = false) => {
    // If running in development mode (e.g. localhost), do not trigger live OTA update prompts unless forced
    const isDev =
      Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

    if (isDev && !force) {
      setPhase('idle');
      return;
    }

    let autoAllowed = true;
    try {
      autoAllowed = localStorage.getItem(AUTO_CHECK_KEY) !== 'false';
    } catch {
      // Ignore storage errors
    }
    if (!autoAllowed && !force) {
      setPhase('idle');
      return;
    }

    setPhase('checking');
    setError(null);
    try {
      const res = await call<OtaStatus>('ota_check');
      setStatus(res);
      if (res.hasUpdate && res.latestVersion) {
        let dismissedSession: string | null = null;
        let dismissedLocal: string | null = null;
        try {
          dismissedSession = sessionStorage.getItem(DISMISSED_KEY);
          dismissedLocal = localStorage.getItem(DISMISSED_KEY);
        } catch {
          // Ignore storage errors
        }
        if (!force && (dismissedSession === res.latestVersion || dismissedLocal === res.latestVersion)) {
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
        if (status?.latestVersion) {
          try {
            localStorage.setItem(DISMISSED_KEY, status.latestVersion);
          } catch {
            // Ignore storage errors
          }
        }
        window.location.reload();
      } else {
        setPhase('idle');
      }
    } catch (e) {
      setError(typeof e === 'string' ? e : 'error');
      setPhase('error');
    }
  }, [status?.latestVersion]);

  const dismiss = useCallback((permanent = false) => {
    if (status?.latestVersion) {
      try {
        if (permanent) {
          localStorage.setItem(DISMISSED_KEY, status.latestVersion);
        } else {
          sessionStorage.setItem(DISMISSED_KEY, status.latestVersion);
        }
      } catch {
        // Ignore storage errors
      }
    }
    setPhase('idle');
  }, [status?.latestVersion]);

  const resetOta = useCallback(async () => {
    try {
      await call<boolean>('ota_reset');
      try {
        localStorage.removeItem(DISMISSED_KEY);
        sessionStorage.removeItem(DISMISSED_KEY);
      } catch {
        // Ignore storage errors
      }
      window.location.reload();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'error');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void check(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [check]);

  return {
    phase,
    status,
    error,
    autoCheckEnabled,
    setAutoCheckEnabled,
    check,
    apply,
    dismiss,
    resetOta,
  };
}
