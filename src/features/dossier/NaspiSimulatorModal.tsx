import { useState } from 'react';
import { Banknote, X, Calendar, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Person } from '../../shared/types';
import { parseDays } from '../../shared/scoring';

export interface NaspiSimulatorModalProps {
  person: Person;
  onClose: () => void;
}

export function NaspiSimulatorModal({ person, onClose }: NaspiSimulatorModalProps) {
  // Extract services to precompute estimated worked weeks
  const services = (person.records || []).filter(r => r.kind === 'service');
  let totalServiceDays = 0;
  for (const s of services) {
    totalServiceDays += parseDays(s.start, s.end);
  }

  const estimatedWeeks = Math.min(208, Math.round(totalServiceDays / 7));
  const defaultWeeks = Math.max(13, Math.min(104, estimatedWeeks > 0 ? estimatedWeeks : 38));

  const [weeksWorked, setWeeksWorked] = useState(defaultWeeks);
  const [grossMonthlyWage, setGrossMonthlyWage] = useState(1450); // Typical ATA wage
  const [ageOver55, setAgeOver55] = useState(false);
  const [terminationDate, setTerminationDate] = useState('2025-06-30'); // Typical 30 June end

  // Calculate NASpI metrics
  const isEligible = weeksWorked >= 13;
  const durationWeeks = Math.floor(weeksWorked / 2);
  const durationMonths = Number((durationWeeks / 4.33).toFixed(1));

  // Thresholds (INPS 2024-2025 reference limits)
  const SOGLIA_BASE = 1425.21;
  const MASSIMALE_NASPI = 1550.42;

  let baseMonthlyNaspi = 0;
  if (grossMonthlyWage <= SOGLIA_BASE) {
    baseMonthlyNaspi = grossMonthlyWage * 0.75;
  } else {
    baseMonthlyNaspi = (SOGLIA_BASE * 0.75) + ((grossMonthlyWage - SOGLIA_BASE) * 0.25);
  }
  baseMonthlyNaspi = Math.min(baseMonthlyNaspi, MASSIMALE_NASPI);

  // Month-by-month projection with decalage (-3% from month 6 or 8)
  const decalageStartMonth = ageOver55 ? 8 : 6;
  const monthlyProjection: { month: number; gross: number; netEst: number }[] = [];
  const totalMonths = Math.ceil(durationMonths);

  let currentGross = baseMonthlyNaspi;
  let cumulativeTotal = 0;

  for (let m = 1; m <= Math.min(totalMonths, 24); m++) {
    if (m >= decalageStartMonth) {
      currentGross = currentGross * 0.97;
    }
    const netEst = currentGross * 0.82; // Rough net after Irpef
    cumulativeTotal += currentGross;
    monthlyProjection.push({
      month: m,
      gross: Math.round(currentGross * 100) / 100,
      netEst: Math.round(netEst * 100) / 100,
    });
  }

  // Application deadlines
  const termDate = new Date(terminationDate);
  const deadline68Days = new Date(termDate.getTime() + 68 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT');
  const decorrenza8Days = new Date(termDate.getTime() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, maxWidth: 840, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        
        {/* HEADER */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Banknote color="#059669" size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Simulatore Indennità di Disoccupazione NASpI per Supplenti ATA</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Stima durata, importo mensile, decorrenza e décalage 3% (INPS D.Lgs. 22/2015)</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Data Fine Contratto (30/06 o supplenza)</label>
              <input
                type="date"
                value={terminationDate}
                onChange={e => setTerminationDate(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Settimane Contribuite (ultimi 4 anni)</label>
              <input
                type="number"
                min={0}
                max={208}
                value={weeksWorked}
                onChange={e => setWeeksWorked(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Retribuzione Lorda Mensile Media (€)</label>
              <input
                type="number"
                step={50}
                value={grossMonthlyWage}
                onChange={e => setGrossMonthlyWage(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ageOver55}
                  onChange={e => setAgeOver55(e.target.checked)}
                />
                Età &ge; 55 Anni (Décalage all'8° mese)
              </label>
            </div>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ background: isEligible ? '#ecfdf5' : '#fef2f2', border: `1px solid ${isEligible ? '#a7f3d0' : '#fecaca'}`, padding: 12, borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: isEligible ? '#065f46' : '#991b1b', textTransform: 'uppercase', fontWeight: 600 }}>Diritto NASpI</span>
              <div style={{ fontSize: 18, fontWeight: 700, color: isEligible ? '#047857' : '#dc2626', marginTop: 4 }}>
                {isEligible ? 'IDONEO (Requisiti ok)' : 'NON IDONEO (< 13 sett.)'}
              </div>
              <small style={{ fontSize: 10, color: '#64748b' }}>{weeksWorked} sett. maturate / 13 min</small>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Durata Spettante</span>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                {durationWeeks} sett. (~{durationMonths} mesi)
              </div>
              <small style={{ fontSize: 10, color: '#64748b' }}>50% delle settimane lavorate</small>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Importo 1° Mese (Lordo)</span>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                € {baseMonthlyNaspi.toFixed(2)}
              </div>
              <small style={{ fontSize: 10, color: '#64748b' }}>Stima Netta: ~€ {(baseMonthlyNaspi * 0.82).toFixed(2)}</small>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Totale Stimato Erogato</span>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8', marginTop: 4 }}>
                € {cumulativeTotal.toFixed(2)}
              </div>
              <small style={{ fontSize: 10, color: '#64748b' }}>Complessivo su {monthlyProjection.length} mensilità</small>
            </div>
          </div>

          {/* DÉCALAGE PROJECTION TABLE */}
          <div>
            <h4 style={{ margin: '8px 0', fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="#2563eb" /> Prospetto Mensile con Décalage Progressivo (-3% dal {decalageStartMonth}° mese)
            </h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>Mensilità</th>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>Importo Lordo (€)</th>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>Stima Netta Indicativa (€)</th>
                    <th style={{ padding: '6px 10px', borderBottom: '1px solid #cbd5e1' }}>Stato Variazione</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyProjection.map(p => (
                    <tr key={p.month} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p.month}° Mese</td>
                      <td style={{ padding: '6px 10px', color: '#059669', fontWeight: 700 }}>€ {p.gross.toFixed(2)}</td>
                      <td style={{ padding: '6px 10px' }}>€ {p.netEst.toFixed(2)}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11, color: p.month >= decalageStartMonth ? '#d97706' : '#64748b' }}>
                        {p.month >= decalageStartMonth ? `Riduzione -3% applicata` : 'Pieno importo (75%)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEADLINES WARNING */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle color="#d97706" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              <strong>Scadenze Fondamentali INPS per il Personale della Scuola:</strong>
              <div style={{ marginTop: 4 }}>
                • <strong>Decorrenza immediata (dall'8° giorno):</strong> presentare domanda entro il <strong>{decorrenza8Days}</strong>.
              </div>
              <div>
                • <strong>Termine perentorio di decadenza (68 giorni):</strong> la domanda deve essere trasmessa tassativamente entro il <strong>{deadline68Days}</strong>, a pena di perdita totale dell'indennità.
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="button" onClick={onClose} className="primary">
            Chiudi Simulatore
          </button>
        </div>

      </div>
    </div>
  );
}
