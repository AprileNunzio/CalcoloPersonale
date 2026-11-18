import { useState } from 'react';
import { Award, TrendingUp, Coins, AlertCircle } from 'lucide-react';
import { Person } from '../../shared/types';
import { ContractCategory } from './salaryTables';
import {
  calculateRicostruzioneCarriera,
  calculateMobilitaPunteggio,
} from './careerProgressionCalculations';

export interface RicostruzioneCarrieraCardProps {
  person: Person;
  profile: string;
  contractCategory?: ContractCategory;
}

export function RicostruzioneCarrieraCard({ person, profile, contractCategory }: RicostruzioneCarrieraCardProps) {
  const [yearsSinceRole, setYearsSinceRole] = useState(2);
  const result = calculateRicostruzioneCarriera(person, profile, yearsSinceRole);
  const mobilita = calculateMobilitaPunteggio(person, profile);

  return (
    <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 18, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <Award size={20} color="#2563eb" /> Ricostruzione di Carriera & Arretrati (Tempo Indeterminato)
          </h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Riforma D.L. 69/2023 (Salva Infrazioni - L. 103/2023): riconoscimento integrale 100% pre-ruolo (Art. 569 D.Lgs. 297/94).
          </span>
        </div>

        <div style={{ background: result.isEligibleNow ? '#ecfdf5' : '#eff6ff', border: `1px solid ${result.isEligibleNow ? '#a7f3d0' : '#bfdbfe'}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, color: result.isEligibleNow ? '#065f46' : '#1e40af', fontWeight: 650 }}>
          {result.isEligibleNow ? '✓ Servizio di Ruolo Registrato (DL 69/2023)' : 'ℹ Simulazione Carriera all\'Immissione in Ruolo'}
        </div>
      </div>

      {!result.isEligibleNow && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 11.5, color: '#92400e', lineHeight: 1.4 }}>
            {result.applicabilityNote}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Anzianità Pre-Ruolo Riconosciuta</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
            {result.preRuoloYears}a {result.preRuoloMonths}m ({result.preRuoloTotalDays} gg)
          </div>
          {result.salvaInfrazioniGainYears > 0 ? (
            <small style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>
              +{result.salvaInfrazioniGainYears}a recuperati dal Salva Infrazioni
            </small>
          ) : (
            <small style={{ fontSize: 10, color: '#64748b' }}>Riconoscimento integrale 100%</small>
          )}
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Inquadramento CCNL 2024</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8', marginTop: 4 }}>
            Fascia {result.inquadramentoFascia}
          </div>
          <small style={{ fontSize: 10, color: '#64748b' }}>
            {result.nextFascia ? `${result.yearsToNextFascia} anni al salto a Fascia ${result.nextFascia}` : 'Fascia massima apicale'}
          </small>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Differenziale Mensile Pre-Ruolo</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 4 }}>
            +€ {result.monthlyDifferencePreRuolo.toFixed(2)} / mese
          </div>
          <small style={{ fontSize: 10, color: '#64748b' }}>Rispetto alla fascia di ingresso (0-8)</small>
        </div>

        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>Stima Arretrati Maturati</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#b45309', marginTop: 4 }}>
            € {result.estimatedArrearsGross.toFixed(2)}
          </div>
          <small style={{ fontSize: 10, color: '#92400e' }}>Stima Netta: ~€ {result.estimatedArrearsNet.toFixed(2)}</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 14 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coins size={15} color="#d97706" /> Anni Decorsi dalla Conferma in Ruolo: <strong>{yearsSinceRole} ann{yearsSinceRole === 1 ? 'o' : 'i'}</strong>
          </span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={yearsSinceRole}
            onChange={e => setYearsSinceRole(Number(e.target.value))}
            style={{ width: '100%', marginTop: 10, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
            <span>1 anno</span>
            <span>4 anni</span>
            <span>8 anni</span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
            Gli arretrati sono calcolati sulla differenza tabellare per 13 mensilità a decorrere dall'inquadramento economico ex D.L. 69/2023.
          </p>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} color="#2563eb" /> Punteggio Graduatoria Interna d'Istituto & Mobilità (CCNI)
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: 6 }}>
              {mobilita.punteggioTotaleMobilita} Punti Totali
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#475569', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>• Anzianità di Ruolo: <strong>{mobilita.puntiServizioRuolo} pt</strong> (6 pt/anno)</div>
            <div>• Anzianità Pre-Ruolo: <strong>{mobilita.puntiServizioPreRuolo} pt</strong> (3 pt/anno)</div>
            <div>• Continuità nella Scuola: <strong>{mobilita.puntiContinuitaScuola} pt</strong></div>
            <div>• Esigenze di Famiglia: <strong>{mobilita.puntiEsigenzeFamiglia} pt</strong> ({mobilita.dettagli.filter(d => d.includes('Figlio') || d.includes('Ricongiungimento')).join(', ') || 'Base'})</div>
            {mobilita.puntiTitoliGenerali > 0 && (
              <div>• Titoli Generali (Concorso/Laurea): <strong>{mobilita.puntiTitoliGenerali} pt</strong></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
