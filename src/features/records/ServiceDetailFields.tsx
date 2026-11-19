import {
  CalendarDays,
  CheckCircle2,
  Award,
  Building2,
  Clock,
  Briefcase,
  Coins,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useT } from '../../shared/i18n';
import { FormField } from '../../shared/FormField';
import {
  ServiceSector,
  ServiceContractType,
  evaluateDetailedService,
} from './serviceCalculations';
import { RuoloDetailFields } from './RuoloDetailFields';
import { RuoloDetailsPayload } from './ruoloTypes';

interface ServiceDetailFieldsProps {
  start: string;
  end: string | null;
  profile: string;
  sector: ServiceSector;
  weeklyHours: number;
  contractType: ServiceContractType;
  notes: string;
  onChangeSector: (s: ServiceSector) => void;
  onChangeWeeklyHours: (hours: number) => void;
  onChangeContractType: (ct: ServiceContractType) => void;
  onChangeRuoloDetails?: (updated: Partial<RuoloDetailsPayload>) => void;
}

export function ServiceDetailFields({
  start,
  end,
  profile,
  sector,
  weeklyHours,
  contractType,
  notes,
  onChangeSector,
  onChangeWeeklyHours,
  onChangeContractType,
  onChangeRuoloDetails,
}: ServiceDetailFieldsProps) {
  const t = useT();
  const evaluation = evaluateDetailedService(
    start,
    end,
    sector,
    profile || 'CS',
    weeklyHours,
    contractType
  );

  const fullHours = profile === 'DOCENTE' ? 18 : 36;

  return (
    <div className="service-detail-fields-block">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Tipologia Contratto / Nomina */}
        <FormField
          label="Tipologia Contratto / Nomina"
          tip="Determina la durata e il calcolo del TFR e stipendio"
          status="saved"
        >
          <select
            value={contractType}
            onChange={e => onChangeContractType(e.target.value as ServiceContractType)}
          >
            <option value="term">Fino al termine delle attività didattiche (30 giugno - 10 mesi)</option>
            <option value="annual">Annuale fino al termine dell'anno scolastico (31 agosto - 12 mesi)</option>
            <option value="short">Supplenza breve o temporanea</option>
            <option value="permanent">Ruolo / Tempo Indeterminato</option>
          </select>
        </FormField>

        {/* Settore di Servizio */}
        <FormField
          label={t('serviceSector')}
          tip="Statale attribuisce punteggio pieno e validità per i 24 mesi ATA"
          status="saved"
        >
          <select
            value={sector}
            onChange={e => onChangeSector(e.target.value as ServiceSector)}
          >
            <option value="statale_ata">{t('sectorStataleAta')}</option>
            <option value="statale_docente">{t('sectorStataleDocente')}</option>
            <option value="paritaria_ata">{t('sectorParitariaAta')} (punteggio dimezzato 50%)</option>
            <option value="paritaria_docente">{t('sectorParitariaDocente')} (punteggio dimezzato 50%)</option>
            <option value="ente_locale">Ente Locale / Asilo Nido Comunale (art. 58 L. 124/99)</option>
          </select>
        </FormField>
      </div>

      {/* Orario Settimanale & Ore */}
      <div style={{ background: 'var(--surface-container-high)', padding: 12, borderRadius: 10, border: '1px solid var(--outline-variant)', marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--on-surface)' }}>
            <Clock size={16} color="var(--secondary)" />
            <span>Orario Settimanale di Servizio</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--secondary)' }}>
            {evaluation.weeklyHours} su {fullHours} ore ({evaluation.hourRatioPercent}% {evaluation.hourRatioPercent === 100 ? 'Tempo Pieno' : 'Part-Time'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="range"
            min={6}
            max={fullHours}
            step={1}
            value={evaluation.weeklyHours}
            onChange={e => onChangeWeeklyHours(parseInt(e.target.value, 10))}
            style={{ flex: 1 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`decree-btn ${evaluation.weeklyHours === fullHours ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: 11 }}
              onClick={() => onChangeWeeklyHours(fullHours)}
            >
              Tempo Pieno ({fullHours}h)
            </button>
            <button
              type="button"
              className={`decree-btn ${evaluation.weeklyHours === Math.round(fullHours / 2) ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: 11 }}
              onClick={() => onChangeWeeklyHours(Math.round(fullHours / 2))}
            >
              Metà Tempo ({Math.round(fullHours / 2)}h)
            </button>
            {fullHours === 36 && (
              <button
                type="button"
                className={`decree-btn ${evaluation.weeklyHours === 12 ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => onChangeWeeklyHours(12)}
              >
                12h
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>
          * Nelle graduatorie ATA il servizio part-time si valuta per intero con il massimo del punteggio (art. 2 D.M. 89/2024). L'orario influisce sul calcolo proporzionale dello stipendio e del TFR.
        </div>
      </div>

      {start && (
        <div className="service-live-calc-box" style={{ marginTop: 12 }}>
          <div className="live-calc-header">
            <CalendarDays size={16} />
            <strong>Calcolo Automatico Giuridico & Economico del Contratto</strong>
            <span className="live-days-pill">{evaluation.days} giorni (~{evaluation.months} mesi utili)</span>
          </div>

          <div className="live-calc-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="live-metric">
              <small>Punti Graduatoria ATA</small>
              <strong style={{ color: 'var(--secondary)' }}>+{evaluation.totalSpecificScore.toFixed(2)} pt</strong>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>({evaluation.totalOtherScore.toFixed(2)} aspecifico)</span>
            </div>

            <div className="live-metric">
              <small>Validità 24 Mesi (1ª Fascia)</small>
              <strong className={evaluation.validFor24Months ? 'text-green' : 'text-amber'}>
                {evaluation.validFor24Months ? 'Idoneo (Statale)' : 'Non Idoneo'}
              </strong>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{evaluation.days} gg utili</span>
            </div>

            <div className="live-metric">
              <small>Anno Anzianità / Ricostruzione</small>
              <strong className={evaluation.validForAnnualSeniority ? 'text-green' : 'text-amber'}>
                {evaluation.validForAnnualSeniority ? 'Anno Pieno (&ge;180 gg)' : 'Parziale (<180 gg)'}
              </strong>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Art. 485/569 D.Lgs. 297</span>
            </div>

            <div className="live-metric">
              <small>Stipendio Lordo Mensile</small>
              <strong>€ {evaluation.estimatedGrossMonthly.toFixed(2)}</strong>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>per {evaluation.weeklyHours}h/sett.</span>
            </div>

            <div className="live-metric">
              <small>TFR Maturato Stimato</small>
              <strong style={{ color: 'var(--primary)' }}>€ {evaluation.estimatedContractTfr.toFixed(2)}</strong>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Netto (~19% IRPEF)</span>
            </div>
          </div>
        </div>
      )}

      {contractType === 'permanent' && onChangeRuoloDetails && (
        <RuoloDetailFields
          payload={(() => {
            try {
              if (notes && notes.startsWith('{')) return JSON.parse(notes);
            } catch {
              return {};
            }
            return {};
          })()}
          onChange={onChangeRuoloDetails}
        />
      )}
    </div>
  );
}
