import {
  Crown,
  Building2,
  Repeat,
  Navigation,
  Layers,
  GraduationCap,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { FormField } from '../../shared/FormField';
import { DirectoryPicker, DirectoryEntry } from '../directory/DirectoryPicker';
import {
  RuoloMobilityType,
  AssegnazioneProvvisoriaReason,
  RuoloDetailsPayload,
  RUOLO_MOBILITY_OPTIONS,
  ASSEGNAZIONE_REASONS,
} from './ruoloTypes';

interface RuoloDetailFieldsProps {
  payload: RuoloDetailsPayload;
  onChange: (updated: Partial<RuoloDetailsPayload>) => void;
}

export function RuoloDetailFields({ payload, onChange }: RuoloDetailFieldsProps) {
  const mobility = payload.ruoloMobility || 'titolarita';
  const continuity = typeof payload.continuityYears === 'number' ? payload.continuityYears : 0;

  // Calcolo punti continuità (graduatorie interne d'istituto di mobilità)
  // 2 punti per ogni anno entro i primi 5 anni, 3 punti per ogni anno oltre il 5° anno
  const continuityPoints =
    continuity <= 5 ? continuity * 2 : 5 * 2 + (continuity - 5) * 3;

  return (
    <div
      style={{
        marginTop: 18,
        background: 'linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface-container) 100%)',
        border: '1.5px solid var(--outline-variant)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 4px 16px rgba(168, 85, 247, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown size={20} color="var(--primary)" />
          <strong style={{ color: 'var(--primary)', fontSize: 14 }}>
            Stato Giuridico di Ruolo & Gestione Mobilità (CCNL/CCNI)
          </strong>
        </div>
        <span
          style={{
            background: 'var(--primary)',
            color: 'var(--surface)',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Sparkles size={11} /> Tempo Indeterminato
        </span>
      </div>

      {/* Schede per la tipologia di assegnazione/movimento */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: 6 }}>
          Condizione di Servizio / Movimento di Mobilità
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
          {RUOLO_MOBILITY_OPTIONS.map(opt => {
            const isSelected = mobility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ruoloMobility: opt.value })}
                style={{
                  background: isSelected ? opt.color : 'var(--surface)',
                  color: isSelected ? 'var(--surface)' : 'var(--on-surface-variant)',
                  border: isSelected ? `1.5px solid ${opt.color}` : '1px solid var(--outline-variant)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12 }}>{opt.label}</div>
                <div style={{ fontSize: 10.5, opacity: isSelected ? 0.9 : 0.65, marginTop: 2 }}>
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date di Ruolo e Ambito */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <FormField
          label="Data Decorrenza Giuridica"
          tip="Data formale di immissione in ruolo (spesso 1° settembre)"
          status={payload.ruoloDate ? 'saved' : 'idle'}
        >
          <input
            type="date"
            value={payload.ruoloDate || ''}
            onChange={e => onChange({ ruoloDate: e.target.value })}
          />
        </FormField>

        <FormField
          label="Data Decorrenza Economica"
          tip="Data di effettivo inizio stipendio di ruolo (se diversa da quella giuridica)"
          status={payload.ruoloEconomicDate ? 'saved' : 'idle'}
        >
          <input
            type="date"
            value={payload.ruoloEconomicDate || ''}
            onChange={e => onChange({ ruoloEconomicDate: e.target.value })}
          />
        </FormField>

        <FormField
          label="Ambito Territoriale / Provincia"
          tip="Codice ambito o provincia di titolarità (es. MI, RM, Ambito 0022)"
          status={payload.ruoloAmbito ? 'saved' : 'idle'}
        >
          <input
            type="text"
            placeholder="es. RM / Ambito 01"
            value={payload.ruoloAmbito || ''}
            onChange={e => onChange({ ruoloAmbito: e.target.value.toUpperCase() })}
          />
        </FormField>
      </div>

      {/* Dettagli Mobilità: Assegnazione Provvisoria o Utilizzazione */}
      {(mobility === 'assegnazione_provvisoria' || mobility === 'utilizzazione') && (
        <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--outline-variant)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5, color: 'var(--primary)', marginBottom: 8 }}>
            <Navigation size={15} />
            <span>Sede di Titolarità Organica (Diversa dalla scuola di servizio effettivo)</span>
          </div>

          <div style={{ marginBottom: 10 }}>
            {payload.titolaritaSchool ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-container-high)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--outline-variant)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>
                  {payload.titolaritaSchool.code} · {payload.titolaritaSchool.name} ({payload.titolaritaSchool.municipality})
                </span>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => onChange({ titolaritaSchool: null })}
                >
                  Cambia
                </button>
              </div>
            ) : (
              <DirectoryPicker
                kind="school"
                placeholder="Cerca e seleziona la scuola di titolarità organica..."
                onSelect={(school: DirectoryEntry) => onChange({ titolaritaSchool: school })}
              />
            )}
          </div>

          {mobility === 'assegnazione_provvisoria' && (
            <FormField label="Motivazione Assegnazione Provvisoria (CCNI Mobilità)" tip="Determina la precedenza nell'assegnazione annuale">
              <select
                value={payload.motivoAssegnazione || 'ricongiungimento_figli_under_6'}
                onChange={e => onChange({ motivoAssegnazione: e.target.value as AssegnazioneProvvisoriaReason })}
              >
                {ASSEGNAZIONE_REASONS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>
      )}

      {/* Dettagli Trasferimento */}
      {mobility === 'trasferimento' && (
        <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--outline-variant)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5, color: 'var(--primary)', marginBottom: 8 }}>
            <Repeat size={15} />
            <span>Dettagli Trasferimento (Volontario / Soprannumerario)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <FormField label="Tipologia Trasferimento">
              <select
                value={payload.transferType || 'volontario'}
                onChange={e => onChange({ transferType: e.target.value as 'volontario' | 'ufficio_soprannumerario' })}
              >
                <option value="volontario">A Domanda Volontaria</option>
                <option value="ufficio_soprannumerario">D'Ufficio per Perdente Posto / Esubero</option>
              </select>
            </FormField>
            <FormField label="Scuola di Provenienza (Pre-trasferimento)">
              <input
                type="text"
                placeholder="es. I.C. Leonardo da Vinci"
                value={payload.previousSchoolName || ''}
                onChange={e => onChange({ previousSchoolName: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Continuità di Servizio e Anno di Prova */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 8, border: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Anni di Continuità nella Scuola
            </label>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>
              +{continuityPoints} pt Mobilità
            </span>
          </div>
          <input
            type="number"
            min={0}
            max={40}
            value={continuity}
            onChange={e => onChange({ continuityYears: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            style={{ width: '100%' }}
          />
          <small style={{ fontSize: 10.5, color: 'var(--on-surface-variant)', display: 'block', marginTop: 4 }}>
            2 pt/anno primi 5 anni, 3 pt/anno successivi per graduatoria interna
          </small>
        </div>

        <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 8, border: '1px solid var(--outline-variant)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
            <input
              type="checkbox"
              checked={payload.superamentoAnnoProva ?? true}
              onChange={e => onChange({ superamentoAnnoProva: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <span>Periodo di Prova Superato (Conferma in Ruolo)</span>
          </label>
          <small style={{ fontSize: 10.5, color: 'var(--on-surface-variant)', display: 'block', marginTop: 4 }}>
            {payload.superamentoAnnoProva ?? true
              ? 'Confermato con decreto definitivo di inquadramento'
              : 'Periodo di prova in svolgimento / da convalidare'}
          </small>
        </div>
      </div>
    </div>
  );
}
