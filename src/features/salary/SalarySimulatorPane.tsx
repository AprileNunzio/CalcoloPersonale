import { useState } from 'react';
import {
  Banknote,
  Coins,
  TrendingUp,
  AlertTriangle,
  Clock,
  Briefcase,
  Users,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Person } from '../../shared/types';
import { PROFILE_LABELS, ATA_PROFILES } from '../../shared/personUtils';
import { calculateSalaryBreakdown, SalarySimulationParams } from './salaryCalculations';
import './SalarySimulator.css';

export function SalarySimulatorPane({ person }: { person: Person }) {
  const initialProfile = person.profile || 'CS';

  const [profile, setProfile] = useState<string>(initialProfile);
  const [weeklyHours, setWeeklyHours] = useState<number>(36);
  const [contractType, setContractType] = useState<'annual' | 'term' | 'short'>('term');
  const [monthsWorkedInYear, setMonthsWorkedInYear] = useState<number>(10);
  const [dependentChildrenCount, setDependentChildrenCount] = useState<number>(() => {
    return (person.records || []).filter(r => r.kind === 'child').length;
  });
  const [sicknessDaysInMonth, setSicknessDaysInMonth] = useState<number>(0);
  const [strikeDaysInMonth, setStrikeDaysInMonth] = useState<number>(0);

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
  };

  const result = calculateSalaryBreakdown(simulationParams);

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
            Stima dettagliata del netto mensile, ritenute previdenziali, detrazioni fiscali e TFR in base al CCNL Scuola 2024.
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

      {/* CONTROLS */}
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
              onChange={e => setProfile(e.target.value)}
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
              onChange={e => setWeeklyHours(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
              <span>Spezzone (6h)</span>
              <span>Metà tempo (18h)</span>
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
              onChange={e => setMonthsWorkedInYear(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="salary-control-card">
          <h4>
            <AlertTriangle size={16} /> Assenze & Famiglia nel Mese
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
                onChange={e => setSicknessDaysInMonth(parseInt(e.target.value, 10) || 0)}
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
                onChange={e => setStrikeDaysInMonth(parseInt(e.target.value, 10) || 0)}
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
              onChange={e => setDependentChildrenCount(parseInt(e.target.value, 10) || 0)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="salary-kpi-deck">
        <div className="salary-kpi-card highlight">
          <h5>Netto Mensile Base</h5>
          <div className="salary-kpi-amount">€ {result.monthlyNetSalary.toFixed(2)}</div>
          <small className="muted">Compenso netto ordinario spettante</small>
        </div>

        <div className="salary-kpi-card accent">
          <h5>TFR Maturato Stimato</h5>
          <div className="salary-kpi-amount">€ {result.tfrYearlyEstimated.toFixed(2)}</div>
          <small className="muted">Liquidazione spettante per {monthsWorkedInYear} mesi</small>
        </div>

        <div className="salary-kpi-card">
          <h5>Lordo Mensile Totale</h5>
          <div className="salary-kpi-amount">€ {result.monthlyGross.toFixed(2)}</div>
          <small className="muted">Stipendio + CIA + IVC</small>
        </div>

        <div className="salary-kpi-card amber">
          <h5>Paga Oraria Netta Stimata</h5>
          <div className="salary-kpi-amount">€ {result.hourlyRateNet.toFixed(2)} / ora</div>
          <small className="muted">Rapporto netto / ore effettive</small>
        </div>
      </div>

      {/* DETTAGLIO VOCI CEDOLINO */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins size={18} color="#059669" /> Voci del Cedolino NoiPA & Ritenute di Legge
        </h4>

        <table className="salary-breakdown-table">
          <thead>
            <tr>
              <th>Voce Cedolino</th>
              <th>Descrizione e Riferimento Normativo</th>
              <th style={{ textAlign: 'right' }}>Importo Mensile</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Stipendio Tabellare</strong></td>
              <td className="muted">Retribuzione base prevista dal CCNL Istruzione e Ricerca</td>
              <td style={{ textAlign: 'right' }}>+ € {result.baseSalary.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>{profile === 'DOCENTE' ? 'RPD' : 'CIA'}</strong></td>
              <td className="muted">{profile === 'DOCENTE' ? 'Retribuzione Professionale Docenti' : 'Compenso Individuale Accessorio ATA'}</td>
              <td style={{ textAlign: 'right' }}>+ € {result.ciaOrRpd.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Indennità Vacanza Contrattuale</strong></td>
              <td className="muted">Elemento perequativo / anticipazione contrattuale</td>
              <td style={{ textAlign: 'right' }}>+ € {result.ivc.toFixed(2)}</td>
            </tr>

            {result.sicknessDeductions > 0 && (
              <tr>
                <td style={{ color: '#ef4444' }}><strong>Trattenute per Malattia</strong></td>
                <td className="muted">Decurtazione Brunetta (primi 10 gg) o riduzione retribuzione al 50%/0%</td>
                <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.sicknessDeductions.toFixed(2)}</td>
              </tr>
            )}

            {result.strikeDeductions > 0 && (
              <tr>
                <td style={{ color: '#ef4444' }}><strong>Trattenuta Sciopero</strong></td>
                <td className="muted">Decurtazione per astensione dal lavoro ({strikeDaysInMonth} gg)</td>
                <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.strikeDeductions.toFixed(2)}</td>
              </tr>
            )}

            <tr>
              <td><strong>Ritenuta Previdenziale INPS</strong></td>
              <td className="muted">Contributi IVS fondo pensione a carico dipendente (9.15%)</td>
              <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.inpsPensionContribution.toFixed(2)}</td>
            </tr>

            <tr>
              <td><strong>IRPEF Netta Mensile</strong></td>
              <td className="muted">IRPEF lorda (€ {result.irpefGross.toFixed(2)}) al netto detrazione lavoro (€ {result.employmentTaxCredit.toFixed(2)})</td>
              <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {result.irpefNet.toFixed(2)}</td>
            </tr>

            <tr>
              <td><strong>Addizionale Regionale & Comunale</strong></td>
              <td className="muted">Aliquote medie stimate (Regionale 1.73%, Comunale 0.80%)</td>
              <td style={{ textAlign: 'right' }} className="salary-deduction-badge">- € {(result.regionalTax + result.municipalTax).toFixed(2)}</td>
            </tr>

            {result.cuneoTaxRelief > 0 && (
              <tr>
                <td style={{ color: '#10b981' }}><strong>Esonero Contributivo (Cuneo Fiscale)</strong></td>
                <td className="muted">Sgravio contributivo del 6% o 7% a sostegno dei redditi medio-bassi</td>
                <td style={{ textAlign: 'right' }} className="salary-credit-badge">+ € {result.cuneoTaxRelief.toFixed(2)}</td>
              </tr>
            )}

            <tr>
              <td><strong>NETTO IN BUSTA PAGA</strong></td>
              <td className="muted">Stipendio effettivo accreditato sul conto corrente tramite NoiPA</td>
              <td style={{ textAlign: 'right', fontSize: 16, color: '#059669' }}>€ {result.monthlyNetSalary.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, color: '#64748b', display: 'flex', gap: 10 }}>
        <Info size={18} style={{ flexShrink: 0, color: '#0284c7' }} />
        <div>
          <strong>Nota Metodologica & CCNL:</strong> Gli importi simulati sono basati sulle tabelle ufficiali del CCNL Comparto Istruzione e Ricerca 2019-2021 (firmato il 18/01/2024). L'importo reale del cedolino NoiPA può subire leggere variazioni legate all'applicazione del conguaglio fiscale di fine anno, alle esatte aliquote comunali deliberate dal proprio comune di residenza, e all'eventuale adesione al Fondo di previdenza complementare Espero.
        </div>
      </div>
    </div>
  );
}
