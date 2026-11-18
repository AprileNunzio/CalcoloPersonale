import { useState, useMemo } from 'react';
import {
  Banknote,
  Coins,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  HeartHandshake,
  Users,
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
} from './salaryCalculations';
import { detectCurrentContract, extractAbsenceStats } from './salaryRecordSync';
import { SeniorityProgressionCard } from './SeniorityProgressionCard';
import { TfrHistoryCard } from './TfrHistoryCard';
import { RicostruzioneCarrieraCard } from './RicostruzioneCarrieraCard';
import { FerieMonetizzazioneCard } from './FerieMonetizzazioneCard';
import { SalaryBreakdownTable } from './SalaryBreakdownTable';
import './SalarySimulator.css';

export function SalarySimulatorPane({ person }: { person: Person }) {
  // 1. Detect data automatically from person's records
  const detectedContract = useMemo(
    () => detectCurrentContract(person.records, person.profile),
    [person.records, person.profile]
  );
  const detectedAbsences = useMemo(
    () => extractAbsenceStats(person.records),
    [person.records]
  );

  // 2. Interactive state initialized with automatic detected values
  const [profile, setProfile] = useState<string>(detectedContract.profile);
  const [weeklyHours, setWeeklyHours] = useState<number>(detectedContract.weeklyHours);
  const [contractType, setContractType] = useState<'annual' | 'term' | 'short'>(detectedContract.contractType);
  const [monthsWorkedInYear, setMonthsWorkedInYear] = useState<number>(detectedContract.monthsWorkedInYear);
  const [dependentChildrenCount, setDependentChildrenCount] = useState<number>(detectedAbsences.childrenCount);
  const [sicknessDaysInMonth, setSicknessDaysInMonth] = useState<number>(detectedAbsences.sicknessDaysInMonth);
  const [strikeDaysInMonth, setStrikeDaysInMonth] = useState<number>(detectedAbsences.strikeDaysInMonth);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [showSimulatorControls, setShowSimulatorControls] = useState<boolean>(false);

  // 3. Career Seniority calculation
  const seniority = useMemo(
    () => calculateCareerSeniority(person.records, profile),
    [person.records, profile]
  );
  const [selectedFascia, setSelectedFascia] = useState<SalaryFascia>(seniority.currentFascia);

  // Keep fascia in sync if profile changes and user hasn't chosen custom fascia
  const effectiveFascia = selectedFascia || seniority.currentFascia;

  // 4. Cumulative TFR history across all past years
  const tfrData = useMemo(
    () => calculateTfrHistory(person.records, profile),
    [person.records, profile]
  );

  // Reset to auto-detected values
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
      {/* HEADER HERO */}
      <div className="salary-header-banner">
        <div className="salary-hero-text">
          <h3>
            <Banknote size={26} />
            Simulatore Busta Paga NoiPA & Trattamento di Fine Rapporto (TFR)
          </h3>
          <p>
            Calcolo automatico basato sui contratti, l'anzianità di carriera maturata e le assenze registrate nel tuo fascicolo (CCNL 2024).
          </p>
        </div>

        <div className="salary-big-metric">
          <span className="salary-big-metric-label">Netto Mensile Stimato in Tasca</span>
          <span className="salary-big-metric-val">€ {result.monthlyNetSalary.toFixed(2)}</span>
          {result.estimatedAuuMonthly > 0 && (
            <div style={{ fontSize: 12, opacity: 0.95, marginTop: 4 }}>
              + € {result.estimatedAuuMonthly.toFixed(2)} (Assegno Unico Figli) = <strong>€ {result.totalMonthlyNetWithAuu.toFixed(2)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* AUTO-SYNC STATUS BANNER */}
      <div className="salary-sync-banner">
        <div className="salary-sync-info">
          <Sparkles size={20} color="#059669" />
          <div className="salary-sync-text">
            <h5>
              {isManualOverride ? 'Modalità Simulazione Personalizzata' : 'Sincronizzazione Automatica con Fascicolo Personale Attiva'}
            </h5>
            <p>
              I dati contrattuali, l'anzianità per scatti CCNL e le assenze sono letti automaticamente dal tuo archivio.
            </p>
          </div>
        </div>

        <div className="salary-sync-badges-row">
          <span className="salary-sync-pill" title="Anzianità rilevata dai contratti">
            <CheckCircle2 size={13} />
            {seniority.recognizedYears}a {seniority.recognizedMonths}m anzianità (Fascia {seniority.currentFascia})
          </span>
          {detectedAbsences.sicknessDaysTotalYear > 0 && (
            <span className="salary-sync-pill" title="Giorni di malattia rilevati">
              <HeartHandshake size={13} />
              {detectedAbsences.sicknessDaysTotalYear} gg malattia registrati
            </span>
          )}
          {tfrData.contractsCount > 0 && (
            <span className="salary-sync-pill" title="Contratti inclusi nel TFR">
              <ShieldCheck size={13} />
              {tfrData.contractsCount} contratti nel TFR
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

      {/* CAREER SENIORITY & STEP PROGRESSION CARD */}
      <SeniorityProgressionCard
        seniority={seniority}
        selectedFascia={effectiveFascia}
        onSelectFascia={fascia => {
          setSelectedFascia(fascia);
          setIsManualOverride(true);
        }}
        profileLabel={profileLabel}
      />

      {/* AUTOMATIC CONTRACT & PARAMETERS SUMMARY BAR */}
      <div className="salary-auto-summary-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div className="auto-summary-item">
            <span className="summary-label">Profilo Rilevato</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>{profileLabel}</strong>
          </div>
          <div className="auto-summary-item">
            <span className="summary-label">Orario Contrattuale</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>
              {weeklyHours}h / sett. ({Math.round((weeklyHours / (profile === 'DOCENTE' ? 18 : 36)) * 100)}%)
            </strong>
          </div>
          <div className="auto-summary-item">
            <span className="summary-label">Tipologia Supplenza</span>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>
              {contractType === 'annual' ? 'Annuale al 31/08' : contractType === 'term' ? 'Fino al 30/06' : 'Supplenza breve'}
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

      {/* CONTROLS (EXPANDABLE) */}
      {showSimulatorControls && (
      <div className="salary-controls-grid">
        <div className="salary-control-card">
          <h4>
            <Briefcase size={16} /> Inquadramento e Profilo
          </h4>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
              Profilo Professionale
            </label>
            <select
              value={profile}
              onChange={e => {
                setProfile(e.target.value);
                setIsManualOverride(true);
              }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            >
              {ATA_PROFILES.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} - {p.label}
                </option>
              ))}
              <option value="DOCENTE">DOCENTE - Personale Docente Scuola</option>
            </select>
          </div>

          <div>
            <div className="salary-slider-row">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Orario Settimanale</label>
              <strong>{weeklyHours} ore / sett.</strong>
            </div>
            <input
              type="range"
              min={6}
              max={profile === 'DOCENTE' ? 18 : 36}
              step={1}
              value={weeklyHours}
              onChange={e => {
                setWeeklyHours(parseInt(e.target.value, 10));
                setIsManualOverride(true);
              }}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
              <span>Spezzone (6h)</span>
              <span>Metà tempo ({profile === 'DOCENTE' ? '9h' : '18h'})</span>
              <span>Tempo Pieno ({profile === 'DOCENTE' ? '18h' : '36h'})</span>
            </div>
          </div>
        </div>

        <div className="salary-control-card">
          <h4>
            <Calendar size={16} /> Contratto e Durata
          </h4>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
              Tipologia Supplenza / Incarico
            </label>
            <select
              value={contractType}
              onChange={e => {
                const ct = e.target.value as 'annual' | 'term' | 'short';
                setContractType(ct);
                setIsManualOverride(true);
                if (ct === 'annual') setMonthsWorkedInYear(12);
                if (ct === 'term') setMonthsWorkedInYear(10);
                if (ct === 'short') setMonthsWorkedInYear(4);
              }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            >
              <option value="term">Fino al termine delle attività didattiche (30 giugno - 10 mesi)</option>
              <option value="annual">Annuale fino al termine dell'anno scolastico (31 agosto - 12 mesi)</option>
              <option value="short">Supplenza breve o temporanea</option>
            </select>
          </div>

          <div>
            <div className="salary-slider-row">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Mesi Lavorati nell'Anno</label>
              <strong>{monthsWorkedInYear} mesi</strong>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={monthsWorkedInYear}
              onChange={e => {
                setMonthsWorkedInYear(parseInt(e.target.value, 10));
                setIsManualOverride(true);
              }}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="salary-control-card">
          <h4>
            <AlertTriangle size={16} /> Assenze & Famiglia (Auto-Rilevate)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Giorni Malattia nel Mese
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={sicknessDaysInMonth}
                onChange={e => {
                  setSicknessDaysInMonth(parseInt(e.target.value, 10) || 0);
                  setIsManualOverride(true);
                }}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Giorni Sciopero
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={strikeDaysInMonth}
                onChange={e => {
                  setStrikeDaysInMonth(parseInt(e.target.value, 10) || 0);
                  setIsManualOverride(true);
                }}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
              Figli a Carico (Assegno Unico INPS)
            </label>
            <input
              type="number"
              min={0}
              max={6}
              value={dependentChildrenCount}
              onChange={e => {
                setDependentChildrenCount(parseInt(e.target.value, 10) || 0);
                setIsManualOverride(true);
              }}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      </div>
      )}

      {/* KPI METRICS */}
      <div className="salary-kpi-deck">
        <div className="salary-kpi-card highlight">
          <h5>Netto Mensile Base</h5>
          <div className="salary-kpi-amount">€ {result.monthlyNetSalary.toFixed(2)}</div>
          <small className="muted">Fascia CCNL: {result.fascia} anni</small>
        </div>

        <div className="salary-kpi-card accent">
          <h5>TFR Maturato Anno Corrente</h5>
          <div className="salary-kpi-amount">€ {result.tfrYearlyEstimated.toFixed(2)}</div>
          <small className="muted">Stima liquidazione per {monthsWorkedInYear} mesi</small>
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

      {/* DETTAGLIO VOCI CEDOLINO */}
      <SalaryBreakdownTable
        result={result}
        profile={profile}
        sicknessDaysInMonth={sicknessDaysInMonth}
        strikeDaysInMonth={strikeDaysInMonth}
      />

      {/* CUMULATIVE TFR HISTORY CARD */}
      <TfrHistoryCard tfrData={tfrData} />

      {/* RICOSTRUZIONE DI CARRIERA & ARRETRATI (TEMPO INDETERMINATO / RUOLO) */}
      <RicostruzioneCarrieraCard person={person} profile={profile} />

      {/* FERIE NON GODUTE & MONETIZZAZIONE (TEMPO DETERMINATO / SUPPLENTI) */}
      <FerieMonetizzazioneCard person={person} profile={profile} />
    </div>
  );
}
