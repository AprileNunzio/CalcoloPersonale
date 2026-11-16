export type OtaStatus = {
  currentVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
};

export type OtaPhase = 'idle' | 'checking' | 'ready' | 'applying' | 'error';
