import {
  Briefcase,
  Link2,
  Pencil,
  Trash2,
  Clock,
  Crown,
  Repeat,
  Navigation,
  Award,
  CheckCircle2,
  Calendar,
  School,
  GraduationCap,
  Laptop,
  Keyboard,
  BookOpen,
  HeartPulse,
  Stethoscope,
  Palmtree,
  Languages,
  ShieldCheck,
} from 'lucide-react';
import { Entry } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { parseDays } from '../../shared/scoring';
import { formatDateItalian } from '../../shared/dateUtils';
import {
  ServiceSector,
  ServiceContractType,
  evaluateDetailedService,
} from './serviceCalculations';
import { RuoloMobilityType, AssegnazioneProvvisoriaReason } from './ruoloTypes';
import './RecordItemCard.css';

const absenceKinds = [
  'sickness',
  'specialist',
  'parental',
  'holiday',
  'festivity',
  'bereavement',
  'personal',
  'law104',
  'blood',
  'study',
  'marriage',
  'other',
];

interface RecordItemCardProps {
  record: Entry;
  busy: boolean;
  pending: boolean;
  isDrafting: boolean;
  onEdit: (record: Entry) => void;
  onRemove: (record: Entry) => void;
}

interface ParsedNotesPayload {
  text?: string;
  notesText?: string;
  sector?: ServiceSector;
  contractType?: ServiceContractType;
  weeklyHours?: number;
  linkedPersonId?: string;
  isRuolo?: boolean;
  ruoloDate?: string;
  ruoloEconomicDate?: string;
  ruoloAmbito?: string;
  ruoloMobility?: RuoloMobilityType;
  titolaritaSchool?: { code?: string; name?: string; municipality?: string };
  continuityYears?: number;
  superamentoAnnoProva?: boolean;
  motivoAssegnazione?: AssegnazioneProvvisoriaReason;
  transferType?: 'volontario' | 'ufficio_soprannumerario';
  previousSchoolName?: string;
  isAccessTitle?: boolean;
  isCiad?: boolean;
  accreditingBody?: string;
  kind?: string;
  scoreAchieved?: number;
  scoreBase?: number;
  hasHonors?: boolean;
  level?: string;
}

function parseNotes(notes: string): ParsedNotesPayload {
  try {
    if (notes && notes.startsWith('{')) return JSON.parse(notes);
  } catch {
    return { text: notes };
  }
  return { text: notes };
}

export function RecordItemCard({
  record,
  busy,
  pending,
  isDrafting,
  onEdit,
  onRemove,
}: RecordItemCardProps) {
  const t = useT();
  const parsed = parseNotes(record.notes);
  const isLinked = !!parsed.linkedPersonId;
  const isService = record.kind === 'service';
  const isRuolo = parsed.isRuolo || parsed.contractType === 'permanent';

  const isQualification = record.kind === 'qualification';
  const isAbsence = absenceKinds.includes(record.kind);
  const isCiad =
    !!parsed.isCiad ||
    record.title.toLowerCase().includes('ciad') ||
    record.title.toLowerCase().includes('alfabetizzazione');

  let evaluation = null;
  if (isService) {
    evaluation = evaluateDetailedService(
      record.start,
      record.end,
      parsed.sector || 'statale_ata',
      record.profile || 'CS',
      parsed.weeklyHours,
      parsed.contractType,
    );
  }

  let contractClass = '';
  if (isService) {
    contractClass = isRuolo
      ? 'is-ruolo'
      : parsed.contractType === 'annual'
      ? 'is-annual'
      : parsed.contractType === 'short'
      ? 'is-short'
      : 'is-term';
  } else if (isQualification) {
    contractClass = `is-qualification ${isCiad ? 'has-ciad' : ''}`;
  } else if (isAbsence) {
    contractClass = `is-absence is-${record.kind}`;
  }

  return (
    <article className={`record-card-modern ${contractClass}`}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="card-top-badges">
          {/* Badge Tipo Record */}
          {!isService && (
            <span className="status-chip profile">
              {isQualification ? (
                <Award size={11} />
              ) : isAbsence ? (
                record.kind === 'sickness' ? (
                  <HeartPulse size={11} />
                ) : record.kind === 'holiday' || record.kind === 'festivity' ? (
                  <Palmtree size={11} />
                ) : record.kind === 'specialist' ? (
                  <Stethoscope size={11} />
                ) : (
                  <Clock size={11} />
                )
              ) : null}
              {t(record.kind)}
            </span>
          )}

          {/* Badge per Titoli & Attestati */}
          {isQualification &&
            (parsed.isAccessTitle ||
              record.title.toLowerCase().includes('accesso') ||
              record.title.toLowerCase().includes('maturit') ||
              record.title.toLowerCase().includes('diploma di scuola')) && (
              <span className="status-chip statale-ata">
                <GraduationCap size={11} /> Titolo di Accesso
              </span>
            )}

          {isQualification && isCiad && (
            <span className="status-chip annual">
              <ShieldCheck size={11} /> CIAD Conforme (Accredia)
            </span>
          )}

          {isQualification &&
            (parsed.kind === 'digital' ||
              record.title.toLowerCase().includes('informatica') ||
              record.title.toLowerCase().includes('eipass') ||
              record.title.toLowerCase().includes('icdl')) &&
            !isCiad && (
              <span className="status-chip term">
                <Laptop size={11} /> Certif. Informatica
              </span>
            )}

          {isQualification &&
            (parsed.kind === 'typing' || record.title.toLowerCase().includes('dattilografia')) && (
              <span className="status-chip short">
                <Keyboard size={11} /> Dattilografia (AA)
              </span>
            )}

          {isQualification &&
            (parsed.kind === 'degree' || record.title.toLowerCase().includes('laurea')) && (
              <span className="status-chip ruolo">
                <BookOpen size={11} /> Laurea
              </span>
            )}

          {isQualification &&
            (parsed.kind === 'oss' ||
              record.title.toLowerCase().includes('oss') ||
              record.title.toLowerCase().includes('osa')) && (
              <span className="status-chip statale-ata">
                <HeartPulse size={11} /> Qualifica OSS / OSA
              </span>
            )}

          {isQualification &&
            (parsed.kind === 'language' || record.title.toLowerCase().includes('qcer')) && (
              <span className="status-chip term">
                <Languages size={11} /> QCER {parsed.level || 'B2'}
              </span>
            )}

          {isQualification && typeof record.amount === 'number' && record.amount > 0 && (
            <span className="status-chip statale-ata" style={{ fontWeight: 800 }}>
              +{record.amount.toFixed(2)} pt
            </span>
          )}

          {/* Badge per Assenze & Congedi */}
          {isAbsence && (
            <span className="status-chip profile">
              <Clock size={11} />{' '}
              {record.kind === 'specialist' && typeof record.amount === 'number'
                ? `${record.amount}h fruite`
                : `${parseDays(record.start, record.end)} gg`}
            </span>
          )}

          {isAbsence && record.kind === 'sickness' && (
            <span className="status-chip short">
              100% Retribuzione · Trattenuta Brunetta
            </span>
          )}

          {isAbsence && (record.kind === 'holiday' || record.kind === 'festivity') && (
            <span className="status-chip annual">
              100% Retribuito · Non decurtato
            </span>
          )}

          {isAbsence && record.kind === 'law104' && (
            <span className="status-chip statale-ata">
              100% Retribuito e coperto
            </span>
          )}

          {/* Badge Ruolo o Tipo Contratto per Servizi */}
          {isService && isRuolo && (
            <span className="status-chip ruolo">
              <Crown size={12} /> DI RUOLO (TEMPO INDETERMINATO)
            </span>
          )}

          {isService && !isRuolo && parsed.contractType && (
            <span className={`status-chip ${parsed.contractType}`}>
              <Clock size={11} />
              {parsed.contractType === 'annual'
                ? 'Annuale (31 Ago)'
                : parsed.contractType === 'term'
                ? 'Termine Attività (30 Giu)'
                : 'Supplenza Breve'}
            </span>
          )}

          {/* Profilo ATA */}
          {isService && record.profile && (
            <span className="status-chip profile">
              <Briefcase size={11} />
              {record.profile} · {PROFILE_LABELS[record.profile] || record.profile}
            </span>
          )}

          {/* Settore Statale / Paritaria */}
          {isService && parsed.sector && (
            <span
              className={`status-chip ${
                parsed.sector === 'statale_ata'
                  ? 'statale-ata'
                  : parsed.sector.startsWith('paritaria')
                  ? 'paritaria'
                  : 'profile'
              }`}
            >
              {parsed.sector === 'statale_ata'
                ? 'Statale ATA (Pieno ✓ 24 Mesi)'
                : parsed.sector === 'statale_docente'
                ? 'Statale Docente'
                : parsed.sector === 'ente_locale'
                ? 'Ente Locale (art. 58)'
                : 'Scuola Paritaria (50%)'}
            </span>
          )}

          {/* Orario settimanale */}
          {isService && evaluation && (
            <span className="status-chip profile">
              <Clock size={11} /> {evaluation.weeklyHours}h/sett ({evaluation.hourRatioPercent}%)
            </span>
          )}

          {/* Punteggio graduatorie stimato */}
          {isService && evaluation && (
            <span className="status-chip statale-ata">
              +{evaluation.totalSpecificScore} pt ATA
            </span>
          )}

          {isLinked && (
            <span className="status-chip profile" style={{ color: 'var(--primary)' }}>
              <Link2 size={11} /> Profilo Collegato
            </span>
          )}
        </div>

        <div className="card-title-row">
          <h3 className="card-title">{record.title}</h3>
        </div>

        {isQualification ? (
          <div className="card-dates-row">
            <Calendar size={14} color="var(--primary)" />
            <span>
              Data conseguimento: <strong>{formatDateItalian(record.start) || 'Non specificata'}</strong>
            </span>
            {parsed.scoreAchieved && parsed.scoreBase && (
              <span style={{ color: 'var(--on-surface)', fontWeight: 650 }}>
                · Voto: {parsed.scoreAchieved}/{parsed.scoreBase}
                {parsed.hasHonors ? ' con Lode' : ''}
              </span>
            )}
            {parsed.accreditingBody && (
              <span style={{ color: 'var(--primary)', fontWeight: 650 }}>
                · Ente: {parsed.accreditingBody}
              </span>
            )}
          </div>
        ) : isAbsence ? (
          <div className="card-dates-row">
            <Calendar size={14} color="var(--on-surface-variant)" />
            <span>
              Dal <strong>{formatDateItalian(record.start)}</strong>
              {record.end ? <> al <strong>{formatDateItalian(record.end)}</strong></> : ' (1 giorno)'}
            </span>
            <span style={{ color: 'var(--on-surface-variant)' }}>
              · {parseDays(record.start, record.end)}{' '}
              {parseDays(record.start, record.end) === 1
                ? 'giorno di calendario'
                : 'giorni di calendario'}
            </span>
          </div>
        ) : (
          <div className="card-dates-row">
            <Calendar size={14} color="var(--on-surface-variant)" />
            <span>
              Dal <strong>{formatDateItalian(record.start)}</strong>
              {record.end ? (
                <> al <strong>{formatDateItalian(record.end)}</strong></>
              ) : isRuolo ? (
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {' '}
                  (In corso a tempo indeterminato)
                </span>
              ) : (
                ' (In corso)'
              )}
            </span>
            {evaluation && (
              <span style={{ color: 'var(--on-surface-variant)' }}>
                · {evaluation.days} giorni ({evaluation.months} mesi di anzianità)
              </span>
            )}
          </div>
        )}

        {record.school && (
          <div className="card-school-info">
            <School size={14} color="var(--primary)" />
            <span>
              <strong>{record.school.code}</strong> · {record.school.name} ({record.school.municipality} -{' '}
              {record.school.province})
            </span>
          </div>
        )}

        {/* Box speciale per dettagli Ruolo, Trasferimenti, Assegnazioni Provvisorie */}
        {isService && isRuolo && Boolean(
          parsed.ruoloAmbito ||
          parsed.ruoloMobility ||
          (typeof parsed.continuityYears === 'number' && parsed.continuityYears > 0) ||
          parsed.superamentoAnnoProva
        ) && (
          <div className="ruolo-highlight-box">
            {parsed.ruoloAmbito && (
              <span className="ruolo-tag">
                Ambito/Provincia: <strong>{parsed.ruoloAmbito}</strong>
              </span>
            )}

            {parsed.ruoloMobility === 'assegnazione_provvisoria' && (
              <span className="ruolo-tag" style={{ color: 'var(--primary)' }}>
                <Navigation size={13} />
                In Assegnazione Provvisoria
                {parsed.titolaritaSchool?.name && ` (Titolare a: ${parsed.titolaritaSchool.name})`}
              </span>
            )}

            {parsed.ruoloMobility === 'trasferimento' && (
              <span className="ruolo-tag" style={{ color: 'var(--secondary)' }}>
                <Repeat size={13} />
                Trasferimento{' '}
                {parsed.transferType === 'ufficio_soprannumerario' ? "d'ufficio" : 'volontario'}
                {parsed.previousSchoolName && ` (da: ${parsed.previousSchoolName})`}
              </span>
            )}

            {typeof parsed.continuityYears === 'number' && parsed.continuityYears > 0 && (
              <span className="ruolo-tag" style={{ color: 'var(--secondary)' }}>
                <Award size={13} />
                Continuità di sede: <strong>{parsed.continuityYears} anni</strong> (+
                {parsed.continuityYears <= 5
                  ? parsed.continuityYears * 2
                  : 10 + (parsed.continuityYears - 5) * 3}{' '}
                pt mobilità)
              </span>
            )}

            {parsed.superamentoAnnoProva && (
              <span className="ruolo-tag" style={{ color: 'var(--secondary)' }}>
                <CheckCircle2 size={13} /> Periodo di Prova Superato
              </span>
            )}
          </div>
        )}

        {(parsed.notesText || parsed.text) && (
          <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
            Note: {parsed.notesText || parsed.text}
          </p>
        )}
      </div>

      <div className="card-actions-col">
        <button
          className="card-action-btn"
          aria-label={t('edit')}
          title={t('edit')}
          disabled={busy || pending || isDrafting}
          onClick={() => onEdit(record)}
        >
          <Pencil size={15} />
        </button>
        <button
          className="card-action-btn delete"
          aria-label={t('remove')}
          title={t('remove')}
          disabled={busy || pending || isDrafting}
          onClick={() => onRemove(record)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}
