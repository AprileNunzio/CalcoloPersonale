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
    <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: 10, padding: 18, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--on-surface)' }}>
            <Award size={20} color="var(--primary)" /> Ricostruzione di Carriera & Arretrati (Tempo Indeterminato)
          </h4>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
            Riforma D.L. 69/2023 (Salva Infrazioni - L. 103/2023): riconoscimento integrale 100% pre-ruolo (Art. 569 D.Lgs. 297/94).
          </span>
        </div>

        <div style={{ background: result.isEligibleNow ? 'var(--secondary-container)' : 'var(--primary-container)', border: `1px solid ${result.isEligibleNow ? 'var(--outline-variant)' : 'var(--outline-variant)'}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, color: result.isEligibleNow ? 'var(--secondary)' : 'var(--primary)', fontWeight: 650 }}>
          {result.isEligibleNow ? '✓ Servizio di Ruolo Registrato (DL 69/2023)' : 'ℹ Simulazione Carriera all\'Immissione in Ruolo'}
        </div>
      </div>

      {!result.isEligibleNow && (
        <div style={{ background: 'var(--tertiary-container)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 10, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={16} color="var(--tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 11.5, color: 'var(--on-tertiary-container)', lineHeight: 1.4 }}>
            {result.applicabilityNote}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Anzianità Pre-Ruolo Riconosciuta</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginTop: 4 }}>
            {result.preRuoloYears}a {result.preRuoloMonths}m ({result.preRuoloTotalDays} gg)
          </div>
          {result.salvaInfrazioniGainYears > 0 ? (
            <small style={{ fontSize: 10, color: 'var(--secondary)', fontWeight: 600 }}>
              +{result.salvaInfrazioniGainYears}a recuperati dal Salva Infrazioni
            </small>
          ) : (
            <small style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Riconoscimento integrale 100%</small>
          )}
        </div>

        <div style={{ background: 'var(--primary-container)', border: '1px solid var(--outline-variant)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 600 }}>Inquadramento CCNL 2024</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
            Fascia {result.inquadramentoFascia}
          </div>
          <small style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>
            {result.nextFascia ? `${result.yearsToNextFascia} anni al salto a Fascia ${result.nextFascia}` : 'Fascia massima apicale'}
          </small>
        </div>

        <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Differenziale Mensile Pre-Ruolo</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--secondary)', marginTop: 4 }}>
            +€ {result.monthlyDifferencePreRuolo.toFixed(2)} / mese
          </div>
          <small style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Rispetto alla fascia di ingresso (0-8)</small>
        </div>

        <div style={{ background: 'var(--tertiary-container)', border: '1px solid var(--outline-variant)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--on-tertiary-container)', textTransform: 'uppercase', fontWeight: 600 }}>Stima Arretrati Maturati</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tertiary)', marginTop: 4 }}>
            € {result.estimatedArrearsGross.toFixed(2)}
          </div>
          <small style={{ fontSize: 10, color: 'var(--on-tertiary-container)' }}>Stima Netta: ~€ {result.estimatedArrearsNet.toFixed(2)}</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 14 }}>
        <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coins size={15} color="var(--tertiary)" /> Anni Decorsi dalla Conferma in Ruolo: <strong>{yearsSinceRole} ann{yearsSinceRole === 1 ? 'o' : 'i'}</strong>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 2 }}>
            <span>1 anno</span>
            <span>4 anni</span>
            <span>8 anni</span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
            Gli arretrati sono calcolati sulla differenza tabellare per 13 mensilità a decorrere dall'inquadramento economico ex D.L. 69/2023.
          </p>
        </div>

        <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} color="var(--primary)" /> Punteggio Graduatoria Interna d'Istituto & Mobilità (CCNI)
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 8px', borderRadius: 6 }}>
              {mobilita.punteggioTotaleMobilita} Punti Totali
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', flexDirection: 'column', gap: 3 }}>
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
