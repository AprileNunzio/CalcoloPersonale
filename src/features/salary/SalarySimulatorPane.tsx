import { useState, useMemo } from 'react';
import {
  Banknote,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Person } from '../../shared/types';
import { ATA_PROFILES } from '../../shared/personUtils';
import {
  calculateSalaryBreakdown,
  calculateCareerSeniority,
  calculateTfrHistory,
  SalarySimulationParams,
  SalaryFascia,
  ContractCategory,
} from './salaryCalculations';
import { detectCurrentContract, extractAbsenceStats } from './salaryRecordSync';
import { SeniorityProgressionCard } from './SeniorityProgressionCard';
import { TfrHistoryCard } from './TfrHistoryCard';
import { RicostruzioneCarrieraCard } from './RicostruzioneCarrieraCard';
import { FerieMonetizzazioneCard } from './FerieMonetizzazioneCard';
import { SalaryBreakdownTable } from './SalaryBreakdownTable';
import { SalaryControls } from './SalaryControls';
import './SalarySimulator.css';

export function SalarySimulatorPane({ person }: { person: Person }) {
  const detectedContract = useMemo(
    () => detectCurrentContract(person.records, person.profile),
    [person.records, person.profile]
  );
  const detectedAbsences = useMemo(
    () => extractAbsenceStats(person.records),
    [person.records]
  );

  const [profile, setProfile] = useState<string>(detectedContract.profile);
  const [weeklyHours, setWeeklyHours] = useState<number>(detectedContract.weeklyHours);
  const [contractType, setContractType] = useState<ContractCategory>(detectedContract.contractType);
  const [monthsWorkedInYear, setMonthsWorkedInYear] = useState<number>(detectedContract.monthsWorkedInYear);
  const [dependentChildrenCount, setDependentChildrenCount] = useState<number>(detectedAbsences.childrenCount);
  const [sicknessDaysInMonth, setSicknessDaysInMonth] = useState<number>(detectedAbsences.sicknessDaysInMonth);
  const [strikeDaysInMonth, setStrikeDaysInMonth] = useState<number>(detectedAbsences.strikeDaysInMonth);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [showSimulatorControls, setShowSimulatorControls] = useState<boolean>(false);

  const seniority = useMemo(
    () => calculateCareerSeniority(person.records, profile),
    [person.records, profile]
  );
  const [selectedFascia, setSelectedFascia] = useState<SalaryFascia>(seniority.currentFascia);
  const effectiveFascia = selectedFascia || seniority.currentFascia;

  const tfrData = useMemo(
    () => calculateTfrHistory(person.records, profile),
    [person.records, profile]
  );

  const handleResetToAuto = () => {
    setProfile(detectedContract.profile);
    setWeeklyHours(detectedContract.weeklyHours);
    setContractType(detectedContract.contractType);
    setMonthsWorkedInYear(detectedContract.monthsWorkedInYear);
    setDependentChildrenCount(detectedAbsences.childrenCount);
    setSicknessDaysInMonth(detectedAbsences.sicknessDaysInMonth);
    setStrikeDaysInMonth(detectedAbsences.strikeDaysInMonth);
    setSelectedFascia(seniority.currentFascia);
    setIsManualOverride(false);
    setShowSimulatorControls(false);
  };

  const simulationParams: SalarySimulationParams = {
    profile,
    weeklyHours,
    contractType,
    monthsWorkedInYear,
    dependentChildrenCount,
    sicknessDaysInMonth,
    strikeDaysInMonth,
    regionalTaxRatePercent: 1.73,
    municipalTaxRatePercent: 0.8,
    overrideFascia: effectiveFascia,
  };

  const result = calculateSalaryBreakdown(simulationParams);
  const profileLabel = profile === 'DOCENTE' ? 'Docente' : (ATA_PROFILES.find(p => p.code === profile)?.label || profile);

  return (
    <div className="salary-simulator-root">
      <div className="salary-header-banner">
        <div className="salary-hero-text">
          <h3>
            <Banknote size={26} />
            Simulatore Busta Paga NoiPA & Trattamento di Fine Rapporto (TFR)
          </h3>
          <p>
            Calcolo automatico basato sui contratti, l'anzianità di carriera e le assenze del fascicolo ex CCNL 2024 e normative vigenti.
          </p>
        </div>

        <div className="salary-big-metric">
          <span className="salary-big-metric-label">Netto Mensile Stimato in Tasca</span>
          <span className="salary-big-metric-val">€ {result.monthlyNetSalary.toFixed(2)}</span>
          {result.estimatedAuuMonthly > 0 && (
            <div style={{ fontSize: 12, opacity: 0.95, marginTop: 4 }}>
              + € {result.estimatedAuuMonthly.toFixed(2)} (AUU Figli) = <strong>€ {result.totalMonthlyNetWithAuu.toFixed(2)}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="salary-sync-banner">
        <div className="salary-sync-info">
          <Sparkles size={20} color="#059669" />
          <div className="salary-sync-text">
            <h5>
              {isManualOverride ? 'Modalità Simulazione Personalizzata' : 'Sincronizzazione Automatica con Fascicolo Personale Attiva'}
            </h5>
            <p>
              {detectedContract.contractRuleSummary}
            </p>
          </div>
        </div>

        <div className="salary-sync-badges-row">
          <span className="salary-sync-pill" title="Stato contrattuale rilevato">
            <CheckCircle2 size={13} />
            {detectedContract.contractLabel}
          </span>
          <span className="salary-sync-pill" title="Anzianità rilevata dai contratti">
            {seniority.recognizedYears}a {seniority.recognizedMonths}m (Fascia {seniority.currentFascia})
          </span>
          {detectedAbsences.sicknessDaysTotalYear > 0 && (
            <span className="salary-sync-pill" title="Giorni di malattia rilevati">
              <HeartHandshake size={13} />
              {detectedAbsences.sicknessDaysTotalYear} gg malattia
            </span>
          )}
          {tfrData.contractsCount > 0 && (
            <span className="salary-sync-pill" title="Contratti inclusi nel TFR">
              <ShieldCheck size={13} />
              {tfrData.contractsCount} contratti TFR
            </span>
          )}
          {isManualOverride && (
            <button
              type="button"
              className="decree-btn"
              style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={handleResetToAuto}
            >
              <RefreshCw size={12} />
              <span>Ripristina Automatico</span>
            </button>
          )}
        </div>
      </div>

      <SeniorityProgressionCard
        seniority={seniority}
        selectedFascia={effectiveFascia}
        onSelectFascia={fascia => {
          setSelectedFascia(fascia);
          setIsManualOverride(true);
        }}
        profileLabel={profileLabel}
      />

      <div className="salary-auto-summary-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div className="auto-summary-item">
            <span className="summary-label">Profilo</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>{profileLabel}</strong>
          </div>
          <div className="auto-summary-item">
            <span className="summary-label">Orario</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>
              {weeklyHours}h / sett. ({Math.round((weeklyHours / (profile === 'DOCENTE' ? 18 : 36)) * 100)}%)
            </strong>
          </div>
          <div className="auto-summary-item">
            <span className="summary-label">Inquadramento</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>
              {contractType === 'permanent'
                ? 'Ruolo / Indeterminato'
                : contractType === 'annual'
                ? 'Annuale 31/08'
                : contractType === 'term'
                ? 'Fino al 30/06'
                : 'Supplenza breve'}
            </strong>
          </div>
          <div className="auto-summary-item">
            <span className="summary-label">Figli a Carico</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>{dependentChildrenCount}</strong>
          </div>
          {sicknessDaysInMonth > 0 && (
            <div className="auto-summary-item">
              <span className="summary-label">Malattia Mese</span>
              <strong style={{ fontSize: 13, color: '#dc2626' }}>{sicknessDaysInMonth} gg (-{result.sicknessDeductions.toFixed(0)}€)</strong>
            </div>
          )}
        </div>

        <button
          type="button"
          className="salary-toggle-controls-btn"
          onClick={() => setShowSimulatorControls(!showSimulatorControls)}
        >
          <Sliders size={14} />
          <span>{showSimulatorControls ? 'Nascondi Personalizzazione' : 'Personalizza / Simula Scenari'}</span>
          {showSimulatorControls ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showSimulatorControls && (
        <SalaryControls
          profile={profile}
          setProfile={setProfile}
          weeklyHours={weeklyHours}
          setWeeklyHours={setWeeklyHours}
          contractType={contractType}
          setContractType={setContractType}
          monthsWorkedInYear={monthsWorkedInYear}
          setMonthsWorkedInYear={setMonthsWorkedInYear}
          sicknessDaysInMonth={sicknessDaysInMonth}
          setSicknessDaysInMonth={setSicknessDaysInMonth}
          strikeDaysInMonth={strikeDaysInMonth}
          setStrikeDaysInMonth={setStrikeDaysInMonth}
          dependentChildrenCount={dependentChildrenCount}
          setDependentChildrenCount={setDependentChildrenCount}
          setIsManualOverride={setIsManualOverride}
        />
      )}

      <div className="salary-kpi-deck">
        <div className="salary-kpi-card highlight">
          <h5>Netto Mensile Base</h5>
          <div className="salary-kpi-amount">€ {result.monthlyNetSalary.toFixed(2)}</div>
          <small className="muted">Fascia CCNL: {result.fascia} anni</small>
        </div>

        <div className="salary-kpi-card accent">
          <h5>TFR Maturato Anno Corrente</h5>
          <div className="salary-kpi-amount">€ {result.tfrYearlyEstimated.toFixed(2)}</div>
          <small className="muted">{result.tfrPaymentMode}</small>
        </div>

        <div className="salary-kpi-card">
          <h5>Lordo Mensile Totale</h5>
          <div className="salary-kpi-amount">€ {result.monthlyGross.toFixed(2)}</div>
          <small className="muted">Stipendio + CIA/RPD + IVC</small>
        </div>

        <div className="salary-kpi-card amber">
          <h5>Paga Oraria Netta Stimata</h5>
          <div className="salary-kpi-amount">€ {result.hourlyRateNet.toFixed(2)} / ora</div>
          <small className="muted">Rapporto netto / ore effettive</small>
        </div>
      </div>

      <SalaryBreakdownTable
        result={result}
        profile={profile}
        sicknessDaysInMonth={sicknessDaysInMonth}
        strikeDaysInMonth={strikeDaysInMonth}
      />

      <TfrHistoryCard tfrData={tfrData} />

      <RicostruzioneCarrieraCard
        person={person}
        profile={profile}
        contractCategory={contractType}
      />

      <FerieMonetizzazioneCard
        person={person}
        profile={profile}
        contractCategory={contractType}
      />
    </div>
  );
}
