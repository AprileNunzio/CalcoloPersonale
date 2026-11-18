import { ProfileScore } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { useT } from '../../shared/i18n';

export interface DashboardScoresPaneProps {
  profileScores: ProfileScore[];
}

export function DashboardScoresPane({ profileScores }: DashboardScoresPaneProps) {
  const t = useT();

  if (profileScores.length === 0) {
    return (
      <div className="panel empty-step-card">
        <p className="muted">{t('noActiveProfilesHelp')}</p>
      </div>
    );
  }

  return (
    <div className="step-pane step-scores-pane">
      <div className="profile-scores-compact-grid">
        {profileScores.map(score => (
          <div className={`compact-score-card profile-${score.code}`} key={score.code}>
            <div className="compact-score-card-main">
              <ProfileBadge3d code={score.code} size={30} />
              <div className="compact-card-title-col">
                <h4>{score.label}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="compact-code-tag">{score.code}</span>
                  {score.useValidatedScore && (
                    <span style={{ fontSize: 10, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                      ✓ Convalidato
                    </span>
                  )}
                </div>
              </div>
              <div className="compact-score-number">
                <strong>{score.effectiveScore.toFixed(2)}</strong>
                <small>{t('points')}</small>
              </div>
            </div>

            <div className="compact-card-metrics">
              <div className="compact-metric-col">
                <span className="compact-metric-label">Accesso</span>
                <span className="compact-metric-val">{score.baseAccessScore.toFixed(2)}</span>
              </div>
              <div className="compact-metric-col">
                <span className="compact-metric-label">Specifico</span>
                <span className="compact-metric-val">{score.specificServiceScore.toFixed(2)}</span>
              </div>
              <div className="compact-metric-col">
                <span className="compact-metric-label">Altro</span>
                <span className="compact-metric-val">{score.otherServiceScore.toFixed(2)}</span>
              </div>
              <div className="compact-metric-col">
                <span className="compact-metric-label">Culturali</span>
                <span className="compact-metric-val">{score.culturalScore.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ padding: '6px 12px 10px 12px' }}>
              {score.requiresCiad ? (
                score.hasCiad ? (
                  <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 650 }}>
                    ✓ CIAD Conforme (CCNL 2024)
                  </span>
                ) : (
                  <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 650 }}>
                    ⚠ CIAD Mancante (Scad. 30/04/2025)
                  </span>
                )
              ) : (
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  Accesso: Diploma (CIAD non richiesta)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
