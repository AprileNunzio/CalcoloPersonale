export function Icon3dFemale({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="fSkin" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffd8c9" />
          <stop offset="70%" stopColor="#f5aa96" />
          <stop offset="100%" stopColor="#d9806e" />
        </radialGradient>
        <radialGradient id="fHair" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#ff7b90" />
          <stop offset="45%" stopColor="#d93b68" />
          <stop offset="100%" stopColor="#8c183e" />
        </radialGradient>
        <radialGradient id="fJacket" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#b388ff" />
          <stop offset="70%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#4a148c" />
        </radialGradient>
        <radialGradient id="fGold" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="50%" stopColor="#ffca28" />
          <stop offset="100%" stopColor="#f57f17" />
        </radialGradient>
        <filter id="fShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#8c183e" floodOpacity="0.25" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#fHair)" opacity="0.12" />
      <path d="M12 58 C12 44 20 40 32 40 C44 40 52 44 52 58 Z" fill="url(#fJacket)" filter="url(#fShadow)" />
      <path d="M26 40 L32 47 L38 40 Z" fill="#ffd8c9" />
      <path d="M16 26 C15 38 20 44 26 44 C26 44 25 36 26 30 Z" fill="url(#fHair)" />
      <path d="M48 26 C49 38 44 44 38 44 C38 44 39 36 38 30 Z" fill="url(#fHair)" />
      <ellipse cx="32" cy="27" rx="14" ry="16" fill="url(#fSkin)" filter="url(#fShadow)" />
      <circle cx="18" cy="29" r="3" fill="url(#fGold)" />
      <circle cx="46" cy="29" r="3" fill="url(#fGold)" />
      <path d="M18 24 C18 13 24 10 32 10 C40 10 46 13 46 24 C44 20 40 16 32 16 C24 16 20 20 18 24 Z" fill="url(#fHair)" />
      <ellipse cx="27" cy="26" rx="2" ry="2.5" fill="#4a1525" />
      <ellipse cx="37" cy="26" rx="2" ry="2.5" fill="#4a1525" />
      <circle cx="26.3" cy="25.2" r="0.7" fill="#ffffff" />
      <circle cx="36.3" cy="25.2" r="0.7" fill="#ffffff" />
      <path d="M29 34 Q32 37 35 34" stroke="#c44569" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="24" cy="30" rx="2.5" ry="1.5" fill="#ff7b90" opacity="0.6" />
      <ellipse cx="40" cy="30" rx="2.5" ry="1.5" fill="#ff7b90" opacity="0.6" />
      <ellipse cx="32" cy="13" rx="7" ry="2" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

export function Icon3dMale({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="mSkin" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffe0b2" />
          <stop offset="70%" stopColor="#ffb74d" />
          <stop offset="100%" stopColor="#f57c00" />
        </radialGradient>
        <radialGradient id="mHair" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#455a64" />
          <stop offset="60%" stopColor="#263238" />
          <stop offset="100%" stopColor="#0d1b2a" />
        </radialGradient>
        <radialGradient id="mSuit" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#42a5f5" />
          <stop offset="70%" stopColor="#1976d2" />
          <stop offset="100%" stopColor="#0d47a1" />
        </radialGradient>
        <radialGradient id="mTie" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff5252" />
          <stop offset="100%" stopColor="#b71c1c" />
        </radialGradient>
        <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0d47a1" floodOpacity="0.25" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#mSuit)" opacity="0.12" />
      <path d="M12 58 C12 43 20 39 32 39 C44 39 52 43 52 58 Z" fill="url(#mSuit)" filter="url(#mShadow)" />
      <polygon points="27,39 32,46 37,39 34,58 30,58" fill="#ffffff" />
      <polygon points="30,42 34,42 33,52 32,54 31,52" fill="url(#mTie)" />
      <ellipse cx="32" cy="26" rx="13.5" ry="15" fill="url(#mSkin)" filter="url(#mShadow)" />
      <path d="M18 20 C18 10 24 8 33 8 C42 8 46 11 46 18 C43 14 36 13 30 13 C24 13 20 16 18 20 Z" fill="url(#mHair)" />
      <ellipse cx="27" cy="25" rx="1.8" ry="2.2" fill="#1a252c" />
      <ellipse cx="37" cy="25" rx="1.8" ry="2.2" fill="#1a252c" />
      <circle cx="26.5" cy="24.4" r="0.6" fill="#ffffff" />
      <circle cx="36.5" cy="24.4" r="0.6" fill="#ffffff" />
      <path d="M29 32 Q32 35 35 32" stroke="#d84315" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="32" cy="11" rx="6" ry="1.8" fill="#ffffff" opacity="0.3" />
    </svg>
  );
}

export function Icon3dNeutral({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="nGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#80cbc4" />
          <stop offset="60%" stopColor="#00897b" />
          <stop offset="100%" stopColor="#004d40" />
        </radialGradient>
        <filter id="nShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#004d40" floodOpacity="0.25" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#nGrad)" opacity="0.15" />
      <circle cx="32" cy="24" r="14" fill="url(#nGrad)" filter="url(#nShadow)" />
      <path d="M14 56 C14 43 22 41 32 41 C42 41 50 43 50 56 Z" fill="url(#nGrad)" filter="url(#nShadow)" />
      <ellipse cx="28" cy="18" rx="6" ry="2.5" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

export function Icon3dDocument({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="docCover" cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#ffb74d" />
          <stop offset="60%" stopColor="#f57c00" />
          <stop offset="100%" stopColor="#e65100" />
        </radialGradient>
        <radialGradient id="docPaper" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
        <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#e65100" floodOpacity="0.3" />
        </filter>
      </defs>
      <rect x="14" y="10" width="36" height="46" rx="8" fill="url(#docCover)" filter="url(#docShadow)" />
      <rect x="18" y="14" width="28" height="38" rx="5" fill="url(#docPaper)" />
      <rect x="22" y="20" width="16" height="3" rx="1.5" fill="#3b82f6" />
      <rect x="22" y="26" width="20" height="2.5" rx="1.25" fill="#94a3b8" />
      <rect x="22" y="31" width="18" height="2.5" rx="1.25" fill="#94a3b8" />
      <rect x="22" y="36" width="14" height="2.5" rx="1.25" fill="#94a3b8" />
      <circle cx="42" cy="42" r="7" fill="#10b981" />
      <path d="M39 42 L41.5 44.5 L45.5 39.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileBadge3d({ code, size = 38 }: { code: string; size?: number }) {
  const configs: Record<string, { g1: string; g2: string; g3: string; border: string }> = {
    CS: { g1: '#34d399', g2: '#059669', g3: '#064e3b', border: '#a7f3d0' },
    AA: { g1: '#60a5fa', g2: '#2563eb', g3: '#1e3a8a', border: '#bfdbfe' },
    AT: { g1: '#c084fc', g2: '#7c3aed', g3: '#4c1d95', border: '#e9d5ff' },
    OS: { g1: '#fbbf24', g2: '#d97706', g3: '#78350f', border: '#fef3c7' },
    CO: { g1: '#fb923c', g2: '#ea580c', g3: '#7c2d12', border: '#ffedd5' },
    IF: { g1: '#f87171', g2: '#dc2626', g3: '#7f1d1d', border: '#fee2e2' },
    GA: { g1: '#2dd4bf', g2: '#0d9488', g3: '#134e4a', border: '#ccfbf1' },
  };
  const c = configs[code] || { g1: '#94a3b8', g2: '#475569', g3: '#1e293b', border: '#e2e8f0' };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${c.g1} 0%, ${c.g2} 70%, ${c.g3} 100%)`,
        boxShadow: `0 4px 10px rgba(0,0,0,0.18), inset 0 2px 3px rgba(255,255,255,0.45)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: size * 0.38,
        letterSpacing: '-0.5px',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        border: `1.5px solid ${c.border}`,
        flexShrink: 0,
      }}
    >
      {code}
    </div>
  );
}
