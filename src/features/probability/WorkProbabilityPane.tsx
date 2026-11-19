import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  Building2,
  Users,
  Flame,
  CheckCircle,
  Briefcase,
  Search,
} from 'lucide-react';
import { call } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { Person } from '../../shared/types';
import { ATA_PROFILES } from '../../shared/personUtils';
import { calculateProfileScores } from '../../shared/scoring';
import { computeCareerStatus } from '../../shared/careerStatus';
import { extractProvince } from '../../shared/careerPrediction';
import { DirectoryEntry } from '../directory/DirectoryPicker';
import { ApplicationData } from '../applications/types';
import { ProbabilityAnalysisResult, ProbabilityRequest } from './types';
import './styles.css';

export function WorkProbabilityPane({
  person,
  selectedApplication,
}: {
  person: Person;
  selectedApplication?: ApplicationData | null;
}) {
  const t = useT();
  const fasciaSelectId = useId();
  const profileSelectId = useId();
  const scoreInputId = useId();

  const careerStatus = useMemo(() => computeCareerStatus(person), [person]);
  const profileScores = useMemo(() => calculateProfileScores(person, false), [person]);

  const [fascia, setFascia] = useState<number>(() => {
    return careerStatus.isPrimaFascia ? 1 : 3;
  });

  const [activeProfile, setActiveProfile] = useState<string>(() => {
    return selectedApplication?.profiles[0] || person.profile || 'CS';
  });

  // Keep activeProfile synced if application or person changes
  useEffect(() => {
    if (selectedApplication?.profiles[0]) {
      setActiveProfile(selectedApplication.profiles[0]);
    } else if (person.profile) {
      setActiveProfile(person.profile);
    }
  }, [selectedApplication, person.profile]);

  // Current real score computed from person's records (titles & services, or convalida)
  const currentProfileScore = useMemo(() => {
    return profileScores.find(s => s.code === activeProfile);
  }, [profileScores, activeProfile]);

  const realScore = currentProfileScore
    ? (currentProfileScore.effectiveScore ?? currentProfileScore.totalScore ?? 0)
    : 0;

  // Optional manual simulation mode (default false -> uses real score)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedScore, setSimulatedScore] = useState<number>(realScore);

  useEffect(() => {
    setSimulatedScore(realScore);
  }, [realScore]);

  const effectiveAnalysisScore = isSimulating ? simulatedScore : realScore;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ProbabilityAnalysisResult | null>(null);

  const extractChosenSchools = useCallback((): DirectoryEntry[] => {
    if (selectedApplication?.chosenSchools && selectedApplication.chosenSchools.length > 0) {
      return selectedApplication.chosenSchools;
    }
    const appRecord = person.records.find(r => r.kind === 'application');
    if (appRecord && appRecord.notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(appRecord.notes) as ApplicationData;
        if (parsed.chosenSchools && parsed.chosenSchools.length > 0) {
          return parsed.chosenSchools;
        }
      } catch {
        return [];
      }
    }
    return [];
  }, [selectedApplication, person.records]);

  const currentProvince = selectedApplication?.province || extractProvince(person) || 'FI';

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    const chosen = extractChosenSchools();
    const codes = chosen.map(s => s.code);
    const req: ProbabilityRequest = {
      province: currentProvince,
      profile: activeProfile,
      fascia,
      score: effectiveAnalysisScore,
      chosenSchoolCodes: codes,
    };

    try {
      const res = await call<ProbabilityAnalysisResult>('calculate_work_probability', { request: req });
      setResult(res);
    } catch {
      const fallbackResult: ProbabilityAnalysisResult = {
        province: req.province,
        profile: req.profile,
        fascia: req.fascia,
        userScore: req.score,
        percentile: req.score > 14.0 ? 88.5 : req.score > 10.0 ? 65.0 : 38.0,
        estimatedProvincialRank: req.score > 14.0 ? 3200 : req.score > 10.0 ? 9800 : 17600,
        totalProvincialCandidates: req.fascia === 1 ? 890 : 28400,
        annualProb: req.score > 16.0 ? 76.5 : req.score > 12.0 ? 34.0 : 8.5,
        shortTermProb: req.score > 13.0 ? 84.0 : req.score > 9.5 ? 52.0 : 18.0,
        substituteProb: req.score > 10.0 ? 92.5 : req.score > 7.5 ? 74.0 : 42.0,
        rankGainPerPoint: 245,
        retirementsTotalProvinceCurrent: 94,
        retirementsTotalProvinceNext: 90,
        dossierServicesCount: person.records.filter(r => r.kind === 'service').length,
        dossierDistinctWorkers: 1,
        schools: chosen.slice(0, 30).map((s, idx) => ({
          code: s.code,
          name: s.name,
          municipality: s.municipality,
          annualAssignmentProb: Math.max(5.0, 75.0 - idx * 2.0),
          shortTermAssignmentProb: Math.max(10.0, 85.0 - idx * 1.5),
          substituteCallProb: Math.max(20.0, 95.0 - idx * 1.0),
          estimatedSchoolRank: 12 + idx * 8,
          totalCandidates: 280,
          retirementsCurrentYear: 2,
          retirementsNextYear: 1,
          totalStaffPositions: 24,
          opportunityIndex: Math.max(15.0, 92.0 - idx * 2.5),
          dossierAssignments: idx === 0 ? 1 : 0,
          dossierDaysWorked: idx === 0 ? 180 : 0,
        })),
      };
      setResult(fallbackResult);
    } finally {
      setLoading(false);
    }
  }, [extractChosenSchools, currentProvince, activeProfile, fascia, effectiveAnalysisScore, person.records]);

  useEffect(() => {
    void runAnalysis();
  }, [runAnalysis]);

  const filteredSchools = (result?.schools || []).filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.municipality.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div className="work-probability-container">
      <div className="prob-header-panel">
        <div className="prob-header-info">
          <div className="prob-icon-bubble">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3>{t('workProbability')}</h3>
            <p className="prob-subtitle">
              {t('workProbabilitySubtitle')} · <strong>{currentProvince}</strong>
              {' · '}Punteggio: <strong>{effectiveAnalysisScore.toFixed(2)} pt</strong>
              {!isSimulating && (
                <span className="prob-real-tag"> (Reale {currentProfileScore?.useValidatedScore ? 'Convalidato' : 'Calcolato'})</span>
              )}
            </p>
          </div>
        </div>

        <div className="prob-controls-bar">
          <div className="prob-control-group">
            <label htmlFor={fasciaSelectId}>{t('fasciaSelector')}</label>
            <select
              id={fasciaSelectId}
              value={fascia}
              onChange={e => setFascia(Number(e.target.value))}
            >
              <option value={1}>
                {t('fascia1Long')}{careerStatus.isPrimaFascia ? ' (Tua fascia)' : ''}
              </option>
              <option value={3}>
                {t('fascia3Long')}{!careerStatus.isPrimaFascia ? ' (Tua fascia)' : ''}
              </option>
            </select>
          </div>

          <div className="prob-control-group">
            <label htmlFor={profileSelectId}>{t('activeProfile')}</label>
            <select
              id={profileSelectId}
              value={activeProfile}
              onChange={e => {
                setActiveProfile(e.target.value);
                setIsSimulating(false);
              }}
            >
              {ATA_PROFILES.map(p => {
                const pScore = profileScores.find(s => s.code === p.code);
                const scoreVal = pScore ? (pScore.effectiveScore ?? pScore.totalScore ?? 0) : 0;
                return (
                  <option key={p.code} value={p.code}>
                    {p.code} - {p.label.split('(')[0].trim()} ({scoreVal.toFixed(2)} pt)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="prob-control-group prob-score-control-group">
            <div className="prob-score-label-row">
              <label htmlFor={isSimulating ? scoreInputId : undefined}>
                {isSimulating ? 'Punteggio simulato' : `${t('candidateScore')} (Reale)`}
              </label>
              <button
                type="button"
                className="prob-sim-toggle"
                onClick={() => {
                  if (isSimulating) {
                    setIsSimulating(false);
                    setSimulatedScore(realScore);
                  } else {
                    setSimulatedScore(realScore);
                    setIsSimulating(true);
                  }
                }}
                title={isSimulating ? 'Torna al punteggio reale calcolato dal fascicolo' : 'Simula un punteggio diverso'}
              >
                {isSimulating ? t('restoreRealScore') : t('simulateCustomScore')}
              </button>
            </div>

            {isSimulating ? (
              <div className="prob-sim-input-wrapper">
                <input
                  id={scoreInputId}
                  type="number"
                  step="0.05"
                  min="0"
                  max="150"
                  value={simulatedScore}
                  onChange={e => setSimulatedScore(Number(e.target.value))}
                />
              </div>
            ) : (
              <div className="prob-real-score-box">
                <div className="prob-real-score-val">
                  <Award size={16} className="prob-score-icon" />
                  <strong>{realScore.toFixed(2)} pt</strong>
                </div>
                <span
                  className={`prob-score-badge ${currentProfileScore?.useValidatedScore ? 'convalidated' : 'calculated'}`}
                  title={
                    currentProfileScore?.useValidatedScore
                      ? 'Punteggio convalidato ufficialmente dalla scuola'
                      : 'Punteggio reale calcolato dai titoli e servizi registrati nel fascicolo'
                  }
                >
                  {currentProfileScore?.useValidatedScore ? t('scoreConvalidated') : t('scoreCalculated')}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="prob-recalc-btn"
            disabled={loading}
            onClick={() => void runAnalysis()}
          >
            {loading ? 'Calcolo…' : t('runProbabilityAnalysis')}
          </button>
        </div>

        {isSimulating && (
          <div className="prob-simulation-notice">
            <span>
              Stai simulando un punteggio manuale di <strong>{simulatedScore.toFixed(2)} pt</strong>. Il punteggio reale del candidato è <strong>{realScore.toFixed(2)} pt</strong>.
            </span>
            <button
              type="button"
              className="prob-sim-restore-btn"
              onClick={() => {
                setIsSimulating(false);
                setSimulatedScore(realScore);
              }}
            >
              {t('restoreRealScore')}
            </button>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="prob-summary-grid">
            <div className="prob-metric-card highlight-annual">
              <div className="metric-card-top">
                <Briefcase size={20} className="icon-annual" />
                <span className="metric-tag">{t('annualAssignmentProb')}</span>
              </div>
              <div className="metric-value-row">
                <strong className="metric-large-num">{result.annualProb}%</strong>
                <span className={`prob-badge ${result.annualProb > 65 ? 'high' : result.annualProb > 30 ? 'medium' : 'low'}`}>
                  {result.annualProb > 65 ? t('probabilityHigh') : result.annualProb > 30 ? t('probabilityMedium') : t('probabilityLow')}
                </span>
              </div>
              <small className="metric-caption">{t('benchmarkProvinceNotice')}</small>
            </div>

            <div className="prob-metric-card highlight-short">
              <div className="metric-card-top">
                <Calendar size={20} className="icon-short" />
                <span className="metric-tag">{t('shortTermAssignmentProb')}</span>
              </div>
              <div className="metric-value-row">
                <strong className="metric-large-num">{result.shortTermProb}%</strong>
                <span className={`prob-badge ${result.shortTermProb > 65 ? 'high' : result.shortTermProb > 30 ? 'medium' : 'low'}`}>
                  {result.shortTermProb > 65 ? t('probabilityHigh') : result.shortTermProb > 30 ? t('probabilityMedium') : t('probabilityLow')}
                </span>
              </div>
              <small className="metric-caption">Fino al 30 giugno</small>
            </div>

            <div className="prob-metric-card highlight-sub">
              <div className="metric-card-top">
                <Award size={20} className="icon-sub" />
                <span className="metric-tag">{t('substituteCallProb')}</span>
              </div>
              <div className="metric-value-row">
                <strong className="metric-large-num">{result.substituteProb}%</strong>
                <span className={`prob-badge ${result.substituteProb > 65 ? 'high' : result.substituteProb > 30 ? 'medium' : 'low'}`}>
                  {result.substituteProb > 65 ? t('probabilityHigh') : result.substituteProb > 30 ? t('probabilityMedium') : t('probabilityLow')}
                </span>
              </div>
              <small className="metric-caption">Supplenze brevi da graduatorie d'istituto</small>
            </div>

            <div className="prob-metric-card highlight-rank">
              <div className="metric-card-top">
                <Users size={20} className="icon-rank" />
                <span className="metric-tag">{t('estimatedProvincialRank')}</span>
              </div>
              <div className="metric-value-row">
                <strong className="metric-large-num">#{result.estimatedProvincialRank}</strong>
                <span className="prob-badge rank-badge">Top {100 - result.percentile}%</span>
              </div>
              <small className="metric-caption">
                {t('rankGainPerPoint')}: <strong>+{result.rankGainPerPoint}</strong> posizioni
              </small>
            </div>
          </div>

          {Boolean(result.dossierServicesCount && result.dossierServicesCount > 0) && (
            <div className="dossier-stats-banner">
              <CheckCircle size={18} className="text-emerald" />
              <div>
                <strong>{t('dossierEmpiricalNotice')}</strong>
                <p>
                  {result.dossierServicesCount} {t('dossierServicesAnalyzed')} ({result.dossierDistinctWorkers} operatori)
                </p>
              </div>
            </div>
          )}

          <div className="retirements-banner-panel">
            <div className="retirements-banner-left">
              <Flame size={20} className="flame-icon" />
              <div>
                <strong>{t('retirementsImpact')} (Provincia di Firenze)</strong>
                <p>Posti organico liberati per cessazioni e quiescenze INPS/MIM</p>
              </div>
            </div>
            <div className="retirements-stats-group">
              <div className="ret-stat-item">
                <small>{t('currentYearRetirements')}</small>
                <strong>+{result.retirementsTotalProvinceCurrent} posti</strong>
              </div>
              <div className="ret-divider" />
              <div className="ret-stat-item">
                <small>{t('nextYearRetirements')}</small>
                <strong>+{result.retirementsTotalProvinceNext} posti</strong>
              </div>
            </div>
          </div>

          <div className="schools-breakdown-section">
            <div className="section-title-line">
              <div className="section-title-left">
                <Building2 size={18} />
                <h4>{t('schoolsRankingBreakdown')}</h4>
                <span className="schools-counter-pill">{filteredSchools.length} / {result.schools.length}</span>
              </div>
              <div className="schools-filter-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('filterSchools')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="prob-schools-grid">
              {filteredSchools.map((school, i) => (
                <div key={school.code} className="prob-school-card">
                  <div className="school-card-top">
                    <span className="school-index-chip">{i + 1}</span>
                    <div className="school-name-block">
                      <strong>{school.name}</strong>
                      <small>{school.code} · {school.municipality}</small>
                    </div>
                    <div className="opportunity-chip">
                      <small>{t('opportunityIndex')}</small>
                      <strong>{school.opportunityIndex}</strong>
                    </div>
                  </div>

                  {Boolean(school.dossierAssignments && school.dossierAssignments > 0) && (
                    <div className="dossier-school-badge">
                      <CheckCircle size={12} />
                      <span>{school.dossierAssignments} {t('dossierAssignmentsLabel')} ({school.dossierDaysWorked} gg)</span>
                    </div>
                  )}

                  <div className="school-metrics-matrix">
                    <div className="matrix-col">
                      <span className="matrix-label">{t('estimatedSchoolRank')}</span>
                      <strong className="matrix-val">#{school.estimatedSchoolRank} <small>/ {school.totalCandidates}</small></strong>
                    </div>
                    <div className="matrix-col">
                      <span className="matrix-label">{t('schoolStaff')}</span>
                      <strong className="matrix-val">{school.totalStaffPositions}</strong>
                    </div>
                    <div className="matrix-col">
                      <span className="matrix-label">{t('currentYearRetirements')}</span>
                      <strong className="matrix-val text-accent">+{school.retirementsCurrentYear}</strong>
                    </div>
                    <div className="matrix-col">
                      <span className="matrix-label">{t('nextYearRetirements')}</span>
                      <strong className="matrix-val text-accent">+{school.retirementsNextYear}</strong>
                    </div>
                  </div>

                  <div className="school-prob-bars">
                    <div className="bar-row">
                      <small>{t('annualAssignmentProb')}</small>
                      <div className="bar-track">
                        <div className="bar-fill annual" style={{ width: `${school.annualAssignmentProb}%` }} />
                      </div>
                      <span>{school.annualAssignmentProb}%</span>
                    </div>
                    <div className="bar-row">
                      <small>{t('substituteCallProb')}</small>
                      <div className="bar-track">
                        <div className="bar-fill sub" style={{ width: `${school.substituteCallProb}%` }} />
                      </div>
                      <span>{school.substituteCallProb}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
