import { Target, TrendingUp, CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';
import { ProfileCareerIntelligence } from '../../shared/careerPrediction';
import { ProfileScore } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { useT } from '../../shared/i18n';
import './careerPrediction.css';

export function CareerIntelligencePane({
  careerIntelligence,
  profileScores,
}: {
  careerIntelligence: ProfileCareerIntelligence[];
  profileScores: ProfileScore[];
}) {
  const t = useT();

  if (careerIntelligence.length === 0) {
    return (
      <div className="panel empty-step-card">
        <Target size={32} />
        <p className="muted">{t('noActiveProfilesHelp')}</p>
      </div>
    );
  }

  return (
    <div className="step-pane step-career-pane">
      <div className="career-intelligence-grid">
        {careerIntelligence.map(item => {
          const scoreItem = profileScores.find(s => s.code === item.profileCode);
          const score = scoreItem?.totalScore ?? 0;
          const { firstTier, callOdds } = item;

          return (
            <div className={`career-card profile-${item.profileCode}`} key={item.profileCode}>
              <div className="career-card-top">
                <div className="career-card-profile">
                  <ProfileBadge3d code={item.profileCode} size={30} />
                  <div className="career-card-title-col">
                    <h4>{scoreItem?.label || item.profileCode}</h4>
                    <span className="career-profile-tag">{item.profileCode}</span>
                  </div>
                </div>
                <div className="career-score-pill">
                  <strong>{score.toFixed(2)}</strong>
                  <small>{t('points')}</small>
                </div>
              </div>

              {/* CIAD Compliance Alert Badge (CCNL 2024) */}
              <div style={{ margin: '6px 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                {scoreItem?.requiresCiad ? (
                  scoreItem.hasCiad ? (
                    <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      ✓ CIAD Accreditata Registrata
                    </span>
                  ) : (
                    <span
                      style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title={scoreItem.ciadWarning}
                    >
                      ⚠ CIAD Mancante (Scad. 30/04/2025)
                    </span>
                  )
                ) : (
                  <span style={{ fontSize: 10, color: '#64748b' }}>
                    Requisito di accesso: Diploma / Terza media (No CIAD)
                  </span>
                )}
              </div>

              <div className="first-tier-block">
                <div className="first-tier-header">
                  <div className="first-tier-title">
                    <Target size={14} />
                    <span>{t('firstTierTarget')}</span>
                  </div>
                  <span className={`first-tier-percent-badge ${firstTier.isEligible ? 'eligible' : 'progress'}`}>
                    {firstTier.isEligible ? t('firstTierEligible') : `${firstTier.percentCompleted}%`}
                  </span>
                </div>

                <div className="first-tier-track">
                  <div
                    className={`first-tier-fill ${firstTier.isEligible ? 'eligible' : ''}`}
                    style={{ width: `${firstTier.percentCompleted}%` }}
                  />
                </div>

                <div className="first-tier-metrics">
                  <span>
                    Validi 24 Mesi ATA: <strong>{firstTier.totalDays} / {firstTier.targetDays} {t('days')}</strong>
                  </span>
                  {!firstTier.isEligible && (
                    <span>
                      {t('daysRemaining')}: <strong>{firstTier.remainingDays} {t('days')}</strong> (~{firstTier.remainingMonths} {t('months')})
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  <span>Specifici: <strong>{firstTier.specificDays} gg</strong></span>
                  {firstTier.otherAtaDays > 0 && <span>Altri ATA: <strong>{firstTier.otherAtaDays} gg</strong></span>}
                  {firstTier.docenteDays > 0 && (
                    <span style={{ color: '#d97706' }} title="Il servizio docente dà punteggio in III fascia ma non concorre ai 24 mesi I fascia ATA (art. 554 D.Lgs. 297/94)">
                      Docente: <strong>{firstTier.docenteDays} gg</strong> (escluso dai 24M ATA)
                    </span>
                  )}
                </div>

                <div className="first-tier-window" style={{ marginTop: 6 }}>
                  <Calendar size={12} />
                  <span>{firstTier.projectedWindow}</span>
                </div>
              </div>

              <div className="call-odds-block">
                <div className="call-odds-header">
                  <div className="call-odds-title">
                    <TrendingUp size={14} />
                    <span>{t('callProbability')}</span>
                  </div>
                  <span className={`call-band-badge ${callOdds.band}`}>
                    {callOdds.percentEstimate}% · {callOdds.band === 'high' ? t('bandHigh') : callOdds.band === 'medium' ? t('bandMedium') : t('bandLow')}
                  </span>
                </div>

                <div className="call-type-row">
                  <span>Tipologia convocazione attesa:</span>
                  <strong className="call-type-tag">{t(callOdds.estimatedCallTypeKey)}</strong>
                </div>

                <div className="strategic-advice-box">
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {t(callOdds.strategicAdviceKey)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="career-notice-bar">
        <Clock size={14} />
        <span>{t('statutoryTargetNotice')}</span>
      </div>
    </div>
  );
}
