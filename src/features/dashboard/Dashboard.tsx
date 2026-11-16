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
} from 'lucide-react';
import { calculateProfileScores } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { AutoSaveContext } from '../autosave/AutoSave';
import { computeSharedFamilyLeave } from '../../shared/familyLeave';
import { calculateEntitlements, ContractType } from '../../shared/entitlements';
import { computeCareerIntelligence } from '../../shared/careerPrediction';
import { CareerIntelligencePane } from './CareerIntelligencePane';
import './Dashboard.css';
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
  const [activeStep, setActiveStep] = useState<'scores' | 'career' | 'services' | 'family' | 'entitlements' | 'all'>('scores');
  const [contractOverride, setContractOverride] = useState<ContractType | undefined>(undefined);

  const profileScores = person ? calculateProfileScores(person) : [];
  const careerIntelligence = person ? computeCareerIntelligence(person, profileScores) : [];
  const sharedLeaves = person ? computeSharedFamilyLeave(person, allPeople) : [];
  const entitlements = person ? calculateEntitlements(person, contractOverride) : null;

  return (
    <div className="dashboard-compact-root">
      <div className="dashboard-top-toolbar">
        <div className="metrics-pill-strip">
          <div className="metric-pill" title={t('serviceDays')}>
            <CalendarDays size={14} />
            <strong>{data?.serviceDays ?? 0}</strong>
            <small>{t('days')}</small>
          </div>
          <div className="metric-pill" title={t('absenceDays')}>
            <Clock3 size={14} />
            <strong>{data?.recordedAbsenceDays ?? 0}</strong>
            <small>{t('absences')}</small>
          </div>
          <div className="metric-pill" title={t('qualifications')}>
            <GraduationCap size={14} />
            <strong>{data?.qualifications ?? 0}</strong>
            <small>{t('qualification')}</small>
          </div>
        </div>

        <div className="step-segmented-control" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'scores'}
            className={`step-tab-btn ${activeStep === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveStep('scores')}
          >
            <Award size={14} />
            <span>{t('stepScores')}</span>
            {profileScores.length > 0 && <span className="step-counter">{profileScores.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'career'}
            className={`step-tab-btn ${activeStep === 'career' ? 'active' : ''}`}
            onClick={() => setActiveStep('career')}
          >
            <Target size={14} />
            <span>{t('stepCareer')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'services'}
            className={`step-tab-btn ${activeStep === 'services' ? 'active' : ''}`}
            onClick={() => setActiveStep('services')}
          >
            <ShieldCheck size={14} />
            <span>{t('stepServices')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'family'}
            className={`step-tab-btn ${activeStep === 'family' ? 'active' : ''}`}
            onClick={() => setActiveStep('family')}
          >
            <Users2 size={14} />
            <span>{t('stepFamily')}</span>
            {sharedLeaves.length > 0 && <span className="step-counter">{sharedLeaves.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'entitlements'}
            className={`step-tab-btn ${activeStep === 'entitlements' ? 'active' : ''}`}
            onClick={() => setActiveStep('entitlements')}
          >
            <Activity size={14} />
            <span>{t('stepEntitlements')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeStep === 'all'}
            className={`step-tab-btn ${activeStep === 'all' ? 'active' : ''}`}
            onClick={() => setActiveStep('all')}
          >
            <Layers size={14} />
            <span>{t('stepAll')}</span>
          </button>
        </div>

        <label className="school-year-compact">
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
              <option key={y} value={y}>
                A.S. {y}/{y + 1}
              </option>
            ))}
          </select>
        </label>
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
                        <span className="compact-code-tag">{score.code}</span>
                      </div>
                      <div className="compact-score-number">
                        <strong>{score.totalScore.toFixed(2)}</strong>
                        <small>{t('points')}</small>
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
            {sharedLeaves.length > 0 ? (
              <div className="shared-leave-cards-grid">
                {sharedLeaves.map((sl, idx) => (
                  <div className="panel shared-leave-card" key={idx}>
                    <div className="shared-leave-header">
                      <div>
                        <h4>{sl.childName}</h4>
                        {sl.birthDate && <small>{sl.birthDate}</small>}
                      </div>
                      {sl.hasOtherParent ? (
                        <span className="badge linked-badge">
                          <Link2 size={12} />
                          {sl.otherParentName}
                        </span>
                      ) : (
                        <span className="badge muted">{t('manualEntry')}</span>
                      )}
                    </div>

                    <div className="shared-leave-metrics">
                      <div className="sl-metric-item">
                        <span className="sl-lbl">{t('parentDays')}</span>
                        <strong className="sl-val">{sl.parentADays} {t('days')}</strong>
                      </div>
                      <div className="sl-metric-item">
                        <span className="sl-lbl">{t('otherParentDays')}</span>
                        <strong className="sl-val">{sl.parentBDays} {t('days')}</strong>
                      </div>
                      <div className="sl-metric-item highlight">
                        <span className="sl-lbl">{t('sharedCapRemaining')}</span>
                        <strong className="sl-val">{sl.remainingDays} {t('days')}</strong>
                      </div>
                      <div className="sl-metric-item">
                        <span className="sl-lbl">{t('maxLimit')}</span>
                        <strong className="sl-val">{sl.maxSharedDays} {t('days')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel empty-step-card">
                <Users2 size={32} />
                <p className="muted">{t('noRecords')}</p>
              </div>
            )}
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
                      <span className="bracket-title">{t('salary100')}</span>
                    </div>
                    <span className="bracket-value">
                      {entitlements.bracket1DaysUsed} / {entitlements.bracket1Max} {t('days')}
                    </span>
                  </div>
                  <div className="bracket-item">
                    <div className="bracket-info">
                      <span className="bracket-dot b-90" />
                      <span className="bracket-title">{t('salary90')}</span>
                    </div>
                    <span className="bracket-value">
                      {entitlements.bracket2DaysUsed} / {entitlements.bracket2Max} {t('days')}
                    </span>
                  </div>
                  <div className="bracket-item">
                    <div className="bracket-info">
                      <span className="bracket-dot b-50" />
                      <span className="bracket-title">{t('salary50')}</span>
                    </div>
                    <span className="bracket-value">
                      {entitlements.bracket3DaysUsed} / {entitlements.bracket3Max} {t('days')}
                    </span>
                  </div>
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
