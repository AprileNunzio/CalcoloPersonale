import { useCallback, useEffect, useState } from 'react';
import { call } from '../../shared/api';
import { OtaPhase, OtaStatus } from './types';

export function useOta() {
  const [phase, setPhase] = useState<OtaPhase>('idle');
  const [status, setStatus] = useState<OtaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setPhase('checking');
    setError(null);
    try {
      const res = await call<OtaStatus>('ota_check');
      setStatus(res);
      setPhase(res.hasUpdate ? 'ready' : 'idle');
    } catch (e) {
      setError(typeof e === 'string' ? e : 'error');
      setPhase('error');
    }
  }, []);

  const apply = useCallback(async () => {
    setPhase('applying');
    setError(null);
    try {
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
    setPhase('idle');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void check();
    }, 3000);
    return () => clearTimeout(timer);
  }, [check]);

  return { phase, status, error, check, apply, dismiss };
}
