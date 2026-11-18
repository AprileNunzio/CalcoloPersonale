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
  Activity,
  Target,
  TrendingUp,
} from 'lucide-react';
import { calculateProfileScores } from '../../shared/scoring';
import { AutoSaveContext } from '../autosave/AutoSave';
import { computeComprehensiveFamilyOverview } from '../../shared/familyLeave';
import { calculateEntitlements, ContractType } from '../../shared/entitlements';
import { computeCareerIntelligence } from '../../shared/careerPrediction';
import { CareerIntelligencePane } from './CareerIntelligencePane';
import { FamilyLeavePane } from './FamilyLeavePane';
import { WorkProbabilityPane } from '../probability/WorkProbabilityPane';
import { DashboardScoresPane } from './DashboardScoresPane';
import { DashboardEntitlementsPane } from './DashboardEntitlementsPane';
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
          <DashboardScoresPane profileScores={profileScores} />
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
          <DashboardEntitlementsPane
            entitlements={entitlements}
            setContractOverride={setContractOverride}
          />
        )}
      </div>
    </div>
  );
}
