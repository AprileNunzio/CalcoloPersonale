import { Briefcase, Calendar, AlertTriangle } from 'lucide-react';
import { ATA_PROFILES } from '../../shared/personUtils';
import { ContractCategory } from './salaryTables';

export interface SalaryControlsProps {
  profile: string;
  setProfile: (p: string) => void;
  weeklyHours: number;
  setWeeklyHours: (h: number) => void;
  contractType: ContractCategory;
  setContractType: (c: ContractCategory) => void;
  monthsWorkedInYear: number;
  setMonthsWorkedInYear: (m: number) => void;
  sicknessDaysInMonth: number;
  setSicknessDaysInMonth: (d: number) => void;
  strikeDaysInMonth: number;
  setStrikeDaysInMonth: (d: number) => void;
  dependentChildrenCount: number;
  setDependentChildrenCount: (c: number) => void;
  setIsManualOverride: (o: boolean) => void;
}

export function SalaryControls({
  profile,
  setProfile,
  weeklyHours,
  setWeeklyHours,
  contractType,
  setContractType,
  monthsWorkedInYear,
  setMonthsWorkedInYear,
  sicknessDaysInMonth,
  setSicknessDaysInMonth,
  strikeDaysInMonth,
  setStrikeDaysInMonth,
  dependentChildrenCount,
  setDependentChildrenCount,
  setIsManualOverride,
}: SalaryControlsProps) {
  return (
    <div className="salary-controls-grid">
      <div className="salary-control-card">
        <h4>
          <Briefcase size={16} /> Inquadramento e Profilo
        </h4>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
            Profilo Professionale
          </label>
          <select
            value={profile}
            onChange={e => {
              setProfile(e.target.value);
              setIsManualOverride(true);
            }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline-variant)' }}
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
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Orario Settimanale</label>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--on-surface-variant)' }}>
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
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
            Tipologia Contratto / Incarico
          </label>
          <select
            value={contractType}
            onChange={e => {
              const ct = e.target.value as ContractCategory;
              setContractType(ct);
              setIsManualOverride(true);
              if (ct === 'permanent') setMonthsWorkedInYear(12);
              if (ct === 'annual') setMonthsWorkedInYear(12);
              if (ct === 'term') setMonthsWorkedInYear(10);
              if (ct === 'short') setMonthsWorkedInYear(4);
            }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline-variant)' }}
          >
            <option value="permanent">Tempo Indeterminato / Ruolo (12 mesi + 13ª, comporto 18 mesi)</option>
            <option value="annual">Annuale fino al 31 agosto (12 mesi, TFR a termine INPS)</option>
            <option value="term">Fino al 30 giugno (10 mesi + NASpI + Ferie non godute Cassazione)</option>
            <option value="short">Supplenza breve e saltuaria (malattia 50% max 30 gg)</option>
          </select>
        </div>

        <div>
          <div className="salary-slider-row">
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Mesi Lavorati nell'Anno</label>
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
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
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
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--outline-variant)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
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
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--outline-variant)' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
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
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--outline-variant)' }}
          />
        </div>
      </div>
    </div>
  );
}
