import { useState, useContext } from 'react';
import {
  Banknote,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { Person, Entry } from '../../shared/types';
import { AutoSaveContext } from '../autosave/AutoSave';
import {
  evaluateNaspiForPerson,
  NaspiPaymentRecord,
} from './naspiCalculations';
import { NaspiPaymentRegister } from './NaspiPaymentRegister';
import './naspi.css';

interface NaspiPageProps {
  person: Person;
  save: (p: Person) => void | Promise<void>;
  busy?: boolean;
}

export function NaspiPage({ person, save, busy }: NaspiPageProps) {
  const evaluation = evaluateNaspiForPerson(person);

  // Bonifici estratti dai records della persona
  const paymentRecords: NaspiPaymentRecord[] = (person.records || [])
    .filter(r => r.kind === 'naspi_payment')
    .map(r => {
      let parsed = {};
      try {
        if (r.notes && r.notes.startsWith('{')) parsed = JSON.parse(r.notes);
      } catch {
        parsed = {};
      }
      return {
        id: r.id,
        paymentDate: r.start,
        amount: typeof r.amount === 'number' ? r.amount : 0,
        competenceMonth: r.title,
        ...(parsed as Record<string, unknown>),
      };
    });

  const handleAddPayment = (p: Omit<NaspiPaymentRecord, 'id'>) => {
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      kind: 'naspi_payment',
      title: p.competenceMonth,
      start: p.paymentDate,
      end: null,
      amount: p.amount,
      notes: JSON.stringify({ daysPaid: p.daysPaid, notes: p.notes }),
    };
    const updatedPerson: Person = {
      ...person,
      records: [...(person.records || []), newEntry],
    };
    void save(updatedPerson);
  };

  const handleRemovePayment = (id: string) => {
    const updatedRecords = (person.records || []).filter(r => r.id !== id);
    const updatedPerson: Person = {
      ...person,
      records: updatedRecords,
    };
    void save(updatedPerson);
  };

  return (
    <div className="naspi-container">
      {/* Header Hero */}
      <div className="naspi-header-hero">
        <div className="naspi-hero-title">
          <h1>
            <Banknote size={26} />
            Simulatore Indennità di Disoccupazione NASpI per Supplenti ATA
          </h1>
          <p>
            Riconoscimento automatico dai servizi dichiarati, stima della durata, importo mensile con décalage 3%,
            decorrenza (8° giorno), scadenza tassativa presentazione e verifica esatta dei bonifici erogati dall'INPS.
          </p>
        </div>

        {!evaluation.isPermanentStaff && (
          <div className="naspi-deadline-badge">
            <div className="days-num">{evaluation.daysLeftToApply}</div>
            <small>Giorni rimasti per presentare domanda</small>
            <div style={{ fontSize: 11, color: '#a7f3d0', marginTop: 2 }}>
              Scadenza tassativa: {evaluation.deadlineDateStr}
            </div>
          </div>
        )}
      </div>

      {/* Alert Personale di Ruolo */}
      {evaluation.isPermanentStaff && (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle color="#dc2626" size={24} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: '#991b1b', fontSize: 14 }}>
              Regime Incompatibilità Personale di Ruolo (Tempo Indeterminato)
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>
              L'ultimo servizio registrato per questa persona è a <strong>Tempo Indeterminato (Ruolo)</strong>.
              In base all'art. 3 del D.Lgs. 22/2015, la NASpI spetta esclusivamente ai lavoratori che abbiano perso involontariamente
              la propria occupazione. Il personale di ruolo non ha accesso alla NASpI in virtù della continuità del rapporto di pubblico impiego.
              I dati sottostanti restano consultabili a scopo di archivio storico per eventuali periodi pre-ruolo a tempo determinato.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="naspi-kpi-grid">
        <div className="naspi-kpi-card">
          <div className="naspi-kpi-label">
            <Clock size={15} color="#059669" /> Settimane Lavorate (4 anni)
          </div>
          <div className="naspi-kpi-value">{evaluation.weeksWorkedLast4Years} sett.</div>
          <div className="naspi-kpi-sub">{evaluation.daysWorkedLast4Years} giorni di servizio effettivo</div>
        </div>

        <div className="naspi-kpi-card">
          <div className="naspi-kpi-label">
            <Calendar size={15} color="#0284c7" /> Durata Indennità
          </div>
          <div className="naspi-kpi-value">{evaluation.durationWeeks} sett.</div>
          <div className="naspi-kpi-sub">Pari a circa {evaluation.durationMonths} mesi di copertura</div>
        </div>

        <div className="naspi-kpi-card">
          <div className="naspi-kpi-label">
            <Banknote size={15} color="#7e22ce" /> Importo Iniziale Netto
          </div>
          <div className="naspi-kpi-value">€ {evaluation.baseMonthlyNet.toFixed(2)}</div>
          <div className="naspi-kpi-sub">Lordo mensile: € {evaluation.baseMonthlyGross.toFixed(2)}</div>
        </div>

        <div className="naspi-kpi-card">
          <div className="naspi-kpi-label">
            <Sparkles size={15} color="#d97706" /> Totale Netto Previsto
          </div>
          <div className="naspi-kpi-value">€ {evaluation.totalProjectedNet.toFixed(2)}</div>
          <div className="naspi-kpi-sub">Totale lordo INPS: € {evaluation.totalProjectedGross.toFixed(2)}</div>
        </div>
      </div>

      {/* Proiezioni Mese per Mese */}
      <div className="naspi-card-panel">
        <h3 className="naspi-card-title">
          <TrendingDown size={19} color="#0284c7" />
          Proiezione Mese per Mese & Meccanismo di Décalage 3% (D.Lgs. 22/2015)
        </h3>
        <p style={{ margin: '-8px 0 16px 0', fontSize: 12.5, color: '#64748b' }}>
          La NASpI si riduce del 3% al mese a partire dal <strong>{evaluation.decalageStartMonth}° mese</strong>
          {evaluation.ageOver55 ? ' (agevolazione over 55 anni attiva)' : ' (lavoratore under 55 anni)'}.
          Decorrenza indennità: <strong>{evaluation.decorrenzaDateStr}</strong> (8° giorno dalla fine del contratto).
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="naspi-projections-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Lordo Mensile</th>
                <th>Décalage 3%</th>
                <th>Stima Netto Erogato</th>
                <th>Note Normative</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.monthlyProjections.map(proj => (
                <tr key={proj.monthIndex}>
                  <td><strong>Mese {proj.monthIndex}</strong></td>
                  <td>€ {proj.grossAmount.toFixed(2)}</td>
                  <td>
                    {proj.isDecalageActive ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>-{proj.decalageRatePercent}%</span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>100% (Senza taglio)</span>
                    )}
                  </td>
                  <td><strong style={{ color: '#0f172a' }}>€ {proj.estimatedNetAmount.toFixed(2)}</strong></td>
                  <td style={{ fontSize: 11.5, color: '#64748b' }}>
                    {proj.monthIndex === 1
                      ? `Decorrenza ${evaluation.decorrenzaDateStr} se domanda inoltrata entro 8 giorni`
                      : proj.isDecalageActive
                      ? 'Decurtazione mensile progressiva ex art. 4 comma 3 D.Lgs. 22/2015'
                      : 'Trattamento pieno senza decurtazione'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro Bonifici Ricevuti & Verifica Automatica */}
      <NaspiPaymentRegister
        evaluation={evaluation}
        payments={paymentRecords}
        onAddPayment={handleAddPayment}
        onRemovePayment={handleRemovePayment}
        busy={busy}
      />
    </div>
  );
}
