import {
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Repeat,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { ProfileScore } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { useT } from '../../shared/i18n';
import './ScoresCard.css';

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ProfileBadge3d code={score.code} size={34} />
                <div className="compact-card-title-col">
                  <h4>{score.label}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span className="compact-code-tag">{score.code}</span>
                    {score.useValidatedScore && (
                      <span
                        style={{
                          fontSize: 10,
                          background: 'var(--secondary-container)',
                          color: 'var(--secondary)',
                          border: '1px solid var(--outline-variant)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        ✓ Convalidato
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="compact-score-number">
                <strong>{score.effectiveScore.toFixed(2)}</strong>
                <small>{t('points')}</small>
              </div>
            </div>

            <div className="compact-card-metrics">
              <div className="compact-metric-col" title="Punti Titolo di Accesso (Diploma / Qualifica)">
                <span className="compact-metric-label">Accesso</span>
                <span className="compact-metric-val">{score.baseAccessScore.toFixed(2)}</span>
              </div>
              <div className="compact-metric-col" title="Servizio Specifico prestato nel profilo ATA">
                <span className="compact-metric-label">Specifico</span>
                <span className="compact-metric-val">{score.specificServiceScore.toFixed(2)}</span>
              </div>
              <div className="compact-metric-col" title="Altro Servizio prestato in diversa qualifica o scuola">
                <span className="compact-metric-label">Altro</span>
                <span className="compact-metric-val">{score.otherServiceScore.toFixed(2)}</span>
              </div>
              <div className="compact-metric-col" title="Titoli Culturali, Certificazioni Informatiche, Laurea">
                <span className="compact-metric-label">Culturali</span>
                <span className="compact-metric-val">{score.culturalScore.toFixed(2)}</span>
              </div>
            </div>

            <div>
              {score.requiresCiad ? (
                score.hasCiad ? (
                  <div className="ciad-status-pill valid">
                    <ShieldCheck size={14} />
                    <span>CIAD Conforme (Accredia DigComp 2.2 - CCNL 2024)</span>
                  </div>
                ) : (
                  <div className="ciad-status-pill missing">
                    <AlertTriangle size={14} />
                    <span>CIAD Mancante (Obbligatoria per Graduatorie ATA)</span>
                  </div>
                )
              ) : (
                <div className="ciad-status-pill not-required">
                  <GraduationCap size={14} />
                  <span>Accesso con Diploma (CIAD non obbligatoria per {score.code})</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
