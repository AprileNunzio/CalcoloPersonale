import { useState, useContext } from 'react';
import { Analysis, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import {
  ShieldCheck,
  CalendarDays,
  GraduationCap,
  Clock3,
  Award,
  Users2,
  Layers,
  Link2,
  Activity,
  AlertCircle,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';
import { calculateProfileScores } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { AutoSaveContext } from '../autosave/AutoSave';
import {
  computeComprehensiveFamilyOverview,
  computeSharedFamilyLeave,
} from '../../shared/familyLeave';
import { calculateEntitlements, ContractType } from '../../shared/entitlements';
import { computeCareerIntelligence } from '../../shared/careerPrediction';
import { CareerIntelligencePane } from './CareerIntelligencePane';
import { FamilyLeavePane } from './FamilyLeavePane';
import { WorkProbabilityPane } from '../probability/WorkProbabilityPane';
import './Dashboard.css';
import './DashboardModern.css';
import './entitlements.css';

export function Dashboard({
  person,
  data,
  year,
  setYear,
}: {
  person?: Person;
  data: Analysis | null;
  year: number;
  setYear: (y: number) => void;
}) {
  const t = useT();
  const context = useContext(AutoSaveContext);
  const allPeople = context?.archive.people || [];
  const [activeStep, setActiveStep] = useState<'scores' | 'probability' | 'career' | 'services' | 'family' | 'entitlements' | 'all'>('scores');
  const [contractOverride, setContractOverride] = useState<ContractType | undefined>(undefined);

  const profileScores = person ? calculateProfileScores(person) : [];
  const careerIntelligence = person ? computeCareerIntelligence(person, profileScores) : [];
  const familyOverview = person ? computeComprehensiveFamilyOverview(person, allPeople) : null;
  const sharedLeaves = familyOverview ? familyOverview.childrenLeaves : [];
  const entitlements = person ? calculateEntitlements(person, contractOverride) : null;
  const bestScore = profileScores.length > 0 ? profileScores[0] : null;

  const totalFamilyCount = (familyOverview?.childrenLeaves.length || 0) + (familyOverview?.spouses.length || 0) + (familyOverview?.others.length || 0);

  return (
    <div className="dashboard-modern-root">
      <div className="dash-command-deck">
        <div className="dash-stats-row">
          <div className="dash-stats-grid">
            <div className="dash-stat-badge" title={t('serviceDays')}>
              <div className="dash-stat-icon">
                <CalendarDays size={18} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-num">{data?.serviceDays ?? 0} {t('days')}</span>
                <span className="dash-stat-label">Servizio Riconosciuto</span>
              </div>
            </div>

            <div className="dash-stat-badge" title={t('absenceDays')}>
              <div className="dash-stat-icon warning">
                <Clock3 size={18} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-num">{data?.recordedAbsenceDays ?? 0} {t('days')}</span>
                <span className="dash-stat-label">Assenze e Congedi</span>
              </div>
            </div>

            <div className="dash-stat-badge" title={t('qualifications')}>
              <div className="dash-stat-icon info">
                <GraduationCap size={18} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-num">{data?.qualifications ?? 0}</span>
                <span className="dash-stat-label">Titoli e Attestati</span>
              </div>
            </div>

            {bestScore && (
              <div className="dash-stat-badge" title={bestScore.useValidatedScore ? 'Punteggio Ufficiale Convalidato dalla Scuola' : 'Punteggio Migliore Calcolato'}>
                <div className={`dash-stat-icon ${bestScore.useValidatedScore ? 'success' : ''}`}>
                  {bestScore.useValidatedScore ? <ShieldCheck size={18} /> : <Award size={18} />}
                </div>
                <div className="dash-stat-content">
                  <span className="dash-stat-num">
                    {bestScore.effectiveScore.toFixed(2)} pt ({bestScore.code})
                  </span>
                  <span className="dash-stat-label">
                    {bestScore.useValidatedScore ? '✓ Convalidato Scuola' : 'Punteggio di Punta'}
                  </span>
                </div>
              </div>
            )}

            {careerIntelligence.length > 0 && (
              <div
                className="dash-stat-badge"
                title="Probabilità di Chiamata (Fascia e Percentile)"
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveStep('probability')}
              >
                <div className="dash-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <TrendingUp size={18} />
                </div>
                <div className="dash-stat-content">
                  <span className="dash-stat-num">
                    {careerIntelligence[0].callOdds.percentEstimate}% ({careerIntelligence[0].callOdds.band.toUpperCase()})
                  </span>
                  <span className="dash-stat-label">Probabilità Lavoro</span>
                </div>
              </div>
            )}
          </div>

          <div className="dash-year-selector">
            <label htmlFor="dash-year-select">Anno Scolastico:</label>
            <select
              id="dash-year-select"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                <option key={y} value={y}>
                  A.S. {y}/{y + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <nav className="dash-tabs-bar" role="tablist" aria-label="Navigazione Sezioni">
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'scores'}
            className={`dash-tab-item ${activeStep === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveStep('scores')}
          >
            <Award size={15} />
            <span>{t('stepScores')}</span>
            {profileScores.length > 0 && <span className="dash-tab-counter">{profileScores.length}</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'probability'}
            className={`dash-tab-item ${activeStep === 'probability' ? 'active' : ''}`}
            onClick={() => setActiveStep('probability')}
          >
            <TrendingUp size={15} />
            <span>Probabilità Lavoro</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'career'}
            className={`dash-tab-item ${activeStep === 'career' ? 'active' : ''}`}
            onClick={() => setActiveStep('career')}
          >
            <Target size={15} />
            <span>{t('stepCareer')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'services'}
            className={`dash-tab-item ${activeStep === 'services' ? 'active' : ''}`}
            onClick={() => setActiveStep('services')}
          >
            <ShieldCheck size={15} />
            <span>{t('stepServices')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'family'}
            className={`dash-tab-item ${activeStep === 'family' ? 'active' : ''}`}
            onClick={() => setActiveStep('family')}
          >
            <Users2 size={15} />
            <span>{t('stepFamily')}</span>
            {totalFamilyCount > 0 && <span className="dash-tab-counter">{totalFamilyCount}</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'entitlements'}
            className={`dash-tab-item ${activeStep === 'entitlements' ? 'active' : ''}`}
            onClick={() => setActiveStep('entitlements')}
          >
            <Activity size={15} />
            <span>{t('stepEntitlements')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'all'}
            className={`dash-tab-item ${activeStep === 'all' ? 'active' : ''}`}
            onClick={() => setActiveStep('all')}
          >
            <Layers size={15} />
            <span>{t('stepAll')}</span>
          </button>
        </nav>
      </div>

      <div className="step-content-viewport">
        {(activeStep === 'scores' || activeStep === 'all') && (
          <div className="step-pane step-scores-pane">
            {profileScores.length > 0 ? (
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
                        <small>{score.useValidatedScore ? 'ufficiale' : t('points')}</small>
                      </div>
                    </div>
                    <div className="compact-breakdown-row">
                      <span title={t('baseAccess')}>
                        Acc: <strong>{score.baseAccessScore.toFixed(2)}</strong>
                      </span>
                      <span title={t('specificService')}>
                        Spec: <strong>{score.specificServiceScore.toFixed(2)}</strong>
                      </span>
                      <span title={t('otherService')}>
                        Altro: <strong>{score.otherServiceScore.toFixed(2)}</strong>
                      </span>
                      <span title={t('culturalTitles')}>
                        Cult: <strong>{score.culturalScore.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel empty-step-card">
                <Award size={32} />
                <p className="muted">{t('noActiveProfilesHelp')}</p>
              </div>
            )}
          </div>
        )}

        {(activeStep === 'probability' || activeStep === 'all') && person && (
          <div className="step-pane step-probability-pane" style={{ marginTop: 12 }}>
            <WorkProbabilityPane person={person} />
          </div>
        )}

        {(activeStep === 'career' || activeStep === 'all') && (
          <CareerIntelligencePane
            careerIntelligence={careerIntelligence}
            profileScores={profileScores}
          />
        )}

        {(activeStep === 'services' || activeStep === 'all') && (
          <div className="step-pane step-services-pane">
            <div className="panel evidence compact-evidence">
              <div className="evidence-header">
                <ShieldCheck size={18} />
                <h3>{t('evidence')}</h3>
              </div>
              <div className="evidence-list">
                {data?.warnings.map(w => (
                  <p key={w}>{t(w)}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeStep === 'family' || activeStep === 'all') && (
          <div className="step-pane step-family-pane">
            <FamilyLeavePane familyOverview={familyOverview} />
          </div>
        )}

        {(activeStep === 'entitlements' || activeStep === 'all') && entitlements && (
          <div className="step-pane step-entitlements-pane">
            <div className="contract-selector-strip">
              <span className="contract-strip-label">{t('contractType')}:</span>
              <div className="contract-pill-group">
                <button
                  type="button"
                  className={`contract-pill-btn ${entitlements.contractType === 'permanent' ? 'active' : ''}`}
                  onClick={() => setContractOverride('permanent')}
                >
                  {t('permanentContract')}
                </button>
                <button
                  type="button"
                  className={`contract-pill-btn ${entitlements.contractType === 'annual' ? 'active' : ''}`}
                  onClick={() => setContractOverride('annual')}
                >
                  {t('annualContract')}
                </button>
                <button
                  type="button"
                  className={`contract-pill-btn ${entitlements.contractType === 'short' ? 'active' : ''}`}
                  onClick={() => setContractOverride('short')}
                >
                  {t('shortContract')}
                </button>
              </div>
            </div>

            <div className="entitlements-cards-grid">
              <div className="panel entitlement-card">
                <div className="entitlement-card-header">
                  <div className="entitlement-header-title">
                    <Activity size={18} />
                    <h4>{t('sicknessAllowance')}</h4>
                  </div>
                  <span className="statutory-pill">{entitlements.totalComportoDays} {t('days')} {t('statutoryLimit')}</span>
                </div>

                <div className="entitlement-progress-container">
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${entitlements.isOverComporto ? 'danger' : ''}`}
                      style={{
                        width: `${Math.min(100, Math.round((entitlements.usedSicknessDays / Math.max(1, entitlements.totalComportoDays)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="progress-bar-legend">
                    <span>{t('used')}: <strong>{entitlements.usedSicknessDays} {t('days')}</strong></span>
                    <span>{t('remaining')}: <strong>{entitlements.remainingComportoDays} {t('days')}</strong></span>
                  </div>
                </div>

                {entitlements.isOverComporto && (
                  <div className="comporto-alert danger">
                    <AlertCircle size={16} />
                    <span>{t('overComportoWarning')}</span>
                  </div>
                )}

                <div className="brackets-breakdown-list">
                  <div className="bracket-item">
                    <div className="bracket-info">
                      <span className="bracket-dot b-100" />
                      <span className="bracket-title">
                        {entitlements.contractType === 'annual'
                          ? '1° mese (1-30 gg): 100% stipendio'
                          : entitlements.contractType === 'short'
                          ? '1° scaglione (non applicabile)'
                          : 'Primi 9 mesi (1-270 gg): 100%'}
                      </span>
                    </div>
                    <span className="bracket-value">
                      {entitlements.bracket1DaysUsed} / {entitlements.bracket1Max} {t('days')}
                    </span>
                  </div>
                  <div className="bracket-item">
                    <div className="bracket-info">
                      <span className="bracket-dot b-90" />
                      <span className="bracket-title">
                        {entitlements.contractType === 'annual'
                          ? '2°-3° mese (31-90 gg): 50% stipendio'
                          : entitlements.contractType === 'short'
                          ? 'Max 30 gg: 50% stipendio'
                          : 'Succ. 3 mesi (271-360 gg): 90%'}
                      </span>
                    </div>
                    <span className="bracket-value">
                      {entitlements.bracket2DaysUsed} / {entitlements.bracket2Max} {t('days')}
                    </span>
                  </div>
                  <div className="bracket-item">
                    <div className="bracket-info">
                      <span className="bracket-dot b-50" />
                      <span className="bracket-title">
                        {entitlements.contractType === 'annual'
                          ? '4°-9° mese (91-270 gg): 0% (posto conservato)'
                          : entitlements.contractType === 'short'
                          ? 'Oltre 30 gg: Risoluzione contratto'
                          : 'Ulteriori 6 mesi (361-540 gg): 50%'}
                      </span>
                    </div>
                    <span className="bracket-value">
                      {entitlements.bracket3DaysUsed} / {entitlements.bracket3Max} {t('days')}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.4, background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  {entitlements.contractType === 'annual'
                    ? 'Normativa CCNL Scuola Art. 19 c. 3 (supplenze fino al 30/06 o 31/08): assenze per malattia max 9 mesi nel triennio scolastico (primi 30 gg retribuiti al 100%, dal 31° al 90° giorno al 50%, dal 91° al 270° giorno allo 0% con diritto alla sola conservazione del posto).'
                    : entitlements.contractType === 'short'
                    ? 'Normativa CCNL Scuola Art. 19 c. 7-10 (supplenze brevi e saltuarie): max 30 giorni per anno solare retribuiti al 50% con conservazione del posto.'
                    : 'Normativa CCNL Scuola Art. 17 (tempo indeterminato): 18 mesi nel triennio scolastico (9 mesi al 100%, 3 mesi al 90%, 6 mesi al 50%).'}
                </div>
              </div>

              <div className="panel entitlement-card">
                <div className="entitlement-card-header">
                  <div className="entitlement-header-title">
                    <Clock3 size={18} />
                    <h4>{t('specialistVisits')}</h4>
                  </div>
                  <span className="statutory-pill">{entitlements.totalSpecialistHours} {t('hours')}</span>
                </div>

                <div className="entitlement-progress-container">
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill specialist"
                      style={{
                        width: `${Math.min(100, Math.round((entitlements.usedSpecialistHours / Math.max(1, entitlements.totalSpecialistHours)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="progress-bar-legend">
                    <span>{t('used')}: <strong>{entitlements.usedSpecialistHours} {t('hours')}</strong></span>
                    <span>{t('remaining')}: <strong>{entitlements.remainingSpecialistHours} {t('hours')}</strong></span>
                  </div>
                </div>

                <div className="statutory-rules-box">
                  <div className="statutory-rules-title">
                    <FileText size={14} />
                    <strong>{t('whatHappensAfter')}</strong>
                  </div>
                  <p>{t('whatHappensAfterText')}</p>
                  <small className="muted">{t('ccnlReference')}</small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
