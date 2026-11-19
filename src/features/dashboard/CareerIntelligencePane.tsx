import { Target, TrendingUp, CheckCircle2, Clock, Calendar, Sparkles, AlertTriangle, Award, Crown } from 'lucide-react';
import { ProfileCareerIntelligence } from '../../shared/careerPrediction';
import { ProfileScore } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { Person } from '../../shared/types';
import { computeCareerMilestones } from '../../shared/careerMilestones';
import { useT } from '../../shared/i18n';
import './careerPrediction.css';

export function CareerIntelligencePane({
  careerIntelligence,
  profileScores,
  person,
}: {
  careerIntelligence: ProfileCareerIntelligence[];
  profileScores: ProfileScore[];
  person?: Person;
}) {
  const t = useT();
  const milestonesSummary = person ? computeCareerMilestones(person) : null;

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
                    <span style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', border: '1px solid var(--outline-variant)', fontSize: 11, padding: '2px 8px', borderRadius: 'var(--shape-full)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> CIAD Accreditata Registrata
                    </span>
                  ) : (
                    <span
                      style={{ background: 'var(--error-container)', color: 'var(--on-error-container)', border: '1px solid var(--error)', fontSize: 11, padding: '2px 8px', borderRadius: 'var(--shape-full)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title={scoreItem.ciadWarning}
                    >
                      <AlertTriangle size={12} /> CIAD Mancante (Scad. 30/04/2025)
                    </span>
                  )
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    Requisito di accesso: Diploma / Terza media (No CIAD)
                  </span>
                )}
              </div>

              <div className="career-bento-body">
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

                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <span>Specifici: <strong>{firstTier.specificDays} gg</strong></span>
                    {firstTier.otherAtaDays > 0 && <span>Altri ATA: <strong>{firstTier.otherAtaDays} gg</strong></span>}
                    {firstTier.docenteDays > 0 && (
                      <span style={{ color: 'var(--tertiary)' }} title="Il servizio docente dà punteggio in III fascia ma non concorre ai 24 mesi I fascia ATA (art. 554 D.Lgs. 297/94)">
                        Docente: <strong>{firstTier.docenteDays} gg</strong> (escluso dai 24M ATA)
                      </span>
                    )}
                  </div>

                  <div className="first-tier-window" style={{ marginTop: 6 }}>
                    <Calendar size={12} />
                    <span>{firstTier.projectedWindow}</span>
                  </div>

                  {milestonesSummary && (() => {
                    const mInfo = milestonesSummary.milestones24M.find(m => m.profileCode === item.profileCode);
                    if (!mInfo) return null;
                    return (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {mInfo.isReached && mInfo.reachedSchoolYear && (
                          <div style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', border: '1px solid var(--secondary)', borderRadius: 'var(--shape-md)', padding: '5px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Award size={13} style={{ flexShrink: 0 }} />
                            <span>
                              {mInfo.milestoneIndex > 1 ? `${mInfo.milestoneIndex}° Traguardo: ` : 'Traguardo 1ª Fascia: '}
                              Raggiunto nell'{mInfo.reachedSchoolYear} ({mInfo.reachedCalendarYear})
                            </span>
                          </div>
                        )}
                        {milestonesSummary.hasRuolo && milestonesSummary.ruoloProfile === item.profileCode && (
                          <div style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', border: '1px solid var(--primary)', borderRadius: 'var(--shape-md)', padding: '5px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Crown size={13} style={{ flexShrink: 0 }} />
                            <span>Titolare di Ruolo a Tempo Indeterminato</span>
                          </div>
                        )}
                        {milestonesSummary.hasRuolo && milestonesSummary.ruoloProfile !== item.profileCode && (
                          <div style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--shape-md)', padding: '5px 8px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={13} style={{ flexShrink: 0, color: 'var(--secondary)' }} />
                            <span>Supplenze possibili ex Art. 59/70 CCNL (Ruolo: {milestonesSummary.ruoloProfile})</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                    <Sparkles size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{t(callOdds.strategicAdviceKey)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="career-notice-bar">
        <Clock size={14} style={{ flexShrink: 0 }} />
        <span>{t('statutoryTargetNotice')}</span>
      </div>
    </div>
  );
}
