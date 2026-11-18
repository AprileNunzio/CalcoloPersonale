import {
  HeartPulse,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Palmtree,
  Stethoscope,
} from 'lucide-react';
import { Person } from '../../shared/types';
import { parseDays } from '../../shared/scoring';
import { computeCareerStatus } from '../../shared/careerStatus';
import { AranCompliancePanel } from './AranCompliancePanel';
import './absences.css';

interface AbsenceComportoPanelProps {
  person: Person;
}

export function AbsenceComportoPanel({ person }: Person extends { records: infer R } ? AbsenceComportoPanelProps : any) {
  const records = person.records || [];
  const career = computeCareerStatus(person);
  const isRuolo = career.isRuolo;

  // Filtra le assenze
  const absences = records.filter(r =>
    ['sickness', 'specialist', 'parental', 'holiday', 'festivity', 'bereavement', 'personal', 'law104', 'blood', 'study', 'marriage'].includes(r.kind)
  );

  let sicknessDays = 0;
  let holidaysUsed = 0;
  let medicalVisitsHours = 0;
  let personalDaysUsed = 0;

  for (const a of absences) {
    const days = parseDays(a.start, a.end);
    if (a.kind === 'sickness') {
      sicknessDays += days;
    } else if (a.kind === 'holiday' || a.kind === 'festivity') {
      holidaysUsed += days;
    } else if (a.kind === 'specialist') {
      medicalVisitsHours += typeof a.amount === 'number' ? a.amount : days * 6;
    } else if (a.kind === 'personal') {
      personalDaysUsed += days;
    }
  }

  // Limiti di legge CCNL 18/01/2024
  const maxComportoDays = isRuolo ? 540 : 270; // 18 mesi Ruolo (art. 17), 9 mesi Determinato (art. 19)
  const remainingComportoDays = Math.max(0, maxComportoDays - sicknessDays);
  const comportoPercent = Math.min(100, Math.round((sicknessDays / maxComportoDays) * 100));

  // Fascia retributiva malattia attuale
  let currentEconomicBand = '100% della retribuzione';
  if (isRuolo) {
    if (sicknessDays > 360) currentEconomicBand = '50% della retribuzione (13°-18° mese)';
    else if (sicknessDays > 270) currentEconomicBand = '90% della retribuzione (10°-12° mese)';
    else currentEconomicBand = '100% della retribuzione (Primi 9 mesi)';
  } else {
    if (sicknessDays > 90) currentEconomicBand = 'Non retribuita con conservazione del posto';
    else if (sicknessDays > 30) currentEconomicBand = '50% della retribuzione (2°-3° mese)';
    else currentEconomicBand = '100% della retribuzione (1° mese)';
  }

  // Ferie spettanti: 32 + 4 festività soppresse = 36 giorni (o 30 per primi 3 anni)
  const totalHolidaysAllowed = isRuolo ? 36 : 32;
  const holidaysRemaining = Math.max(0, totalHolidaysAllowed - holidaysUsed);

  // Permessi visite mediche: 18 ore annue ATA ex art. 68 CCNL
  const maxMedicalHours = 18;
  const medicalHoursRemaining = Math.max(0, maxMedicalHours - medicalVisitsHours);

  return (
    <div className="absence-comporto-deck">
      <div className="absence-header-row">
        <div className="absence-header-title">
          <HeartPulse size={20} color="var(--tertiary)" />
          <span>Monitoraggio Periodo di Comporto & Spettanze Contrattuali (CCNL 18/01/2024)</span>
        </div>
        <span
          style={{
            background: isRuolo ? 'var(--primary)' : 'var(--primary)',
            color: 'var(--surface)',
            fontSize: 11.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
          }}
        >
          Regime: {isRuolo ? 'Tempo Indeterminato (Art. 17)' : 'Tempo Determinato (Art. 19)'}
        </span>
      </div>

      <div className="absence-kpi-grid">
        <div className="absence-kpi-card">
          <div className="absence-kpi-label">
            <HeartPulse size={14} color="var(--tertiary)" /> Malattia Fruita
          </div>
          <div className="absence-kpi-val">{sicknessDays} gg</div>
          <div className="absence-kpi-sub">su {maxComportoDays} giorni max triennio</div>
        </div>

        <div className="absence-kpi-card">
          <div className="absence-kpi-label">
            <Palmtree size={14} color="var(--secondary)" /> Ferie Residue
          </div>
          <div className="absence-kpi-val">{holidaysRemaining} gg</div>
          <div className="absence-kpi-sub">{holidaysUsed} gg fruiti su {totalHolidaysAllowed}</div>
        </div>

        <div className="absence-kpi-card">
          <div className="absence-kpi-label">
            <Stethoscope size={14} color="var(--primary)" /> Visite Mediche
          </div>
          <div className="absence-kpi-val">{medicalHoursRemaining} h</div>
          <div className="absence-kpi-sub">{medicalVisitsHours}h fruite su 18h annue</div>
        </div>

        <div className="absence-kpi-card">
          <div className="absence-kpi-label">
            <ShieldCheck size={14} color="var(--primary)" /> Fascia Retributiva
          </div>
          <div className="absence-kpi-val" style={{ fontSize: 13, color: 'var(--primary)' }}>
            {currentEconomicBand}
          </div>
          <div className="absence-kpi-sub">
            Trattenuta Brunetta: 10 gg per evento
          </div>
        </div>
      </div>

      <div className="comporto-progress-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
          <strong style={{ color: 'var(--on-surface)' }}>
            Avanzamento Periodo di Comporto per Malattia ({comportoPercent}%)
          </strong>
          <span style={{ color: remainingComportoDays < 30 ? 'var(--error)' : 'var(--on-surface-variant)', fontWeight: 650 }}>
            {remainingComportoDays} giorni residui prima del superamento comporto
          </span>
        </div>
        <div className="comporto-track">
          <div
            className={`comporto-fill ${comportoPercent > 70 ? 'danger' : comportoPercent > 35 ? 'warning' : 'safe'}`}
            style={{ width: `${comportoPercent}%` }}
          />
        </div>
        <small style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
          {isRuolo
            ? 'CCNL Art. 17: I primi 9 mesi sono retribuiti al 100%, 3 mesi al 90%, successivi 6 mesi al 50%. Superati i 18 mesi è possibile richiedere ulteriori 18 mesi non retribuiti.'
            : 'CCNL Art. 19: Per i contratti fino al 30/06 o 31/08 il comporto è di 9 mesi nel triennio (1° mese 100%, 2°-3° mese 50%). Per supplenze brevi: max 30 gg/anno al 50%.'}
        </small>
      </div>

      <AranCompliancePanel person={person} />
    </div>
  );
}
