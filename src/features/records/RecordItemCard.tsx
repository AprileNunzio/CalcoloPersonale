import { Briefcase, Link2, Pencil, Trash2, Clock } from 'lucide-react';
import { Entry } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { ServiceSector, ServiceContractType } from './serviceCalculations';

interface RecordItemCardProps {
  record: Entry;
  busy: boolean;
  pending: boolean;
  isDrafting: boolean;
  onEdit: (record: Entry) => void;
  onRemove: (record: Entry) => void;
}

function parseNotes(notes: string): {
  text: string;
  sector?: ServiceSector;
  contractType?: ServiceContractType;
  weeklyHours?: number;
  linkedPersonId?: string;
} {
  try {
    if (notes.startsWith('{')) return JSON.parse(notes);
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

  return (
    <article className="entry">
      <div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 4 }}>
          <span className="badge">{t(record.kind)}</span>
          {record.kind === 'service' && record.profile && (
            <span
              className="badge"
              style={{
                background: '#eaf4f1',
                color: '#166e61',
                borderColor: '#c4e3dc',
                fontWeight: 600,
              }}
            >
              <Briefcase
                size={12}
                style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }}
              />
              {record.profile} · {PROFILE_LABELS[record.profile] || record.profile}
            </span>
          )}
          {record.kind === 'service' && parsed.sector && (
            <span className="badge">
              {parsed.sector === 'ente_locale'
                ? 'Ente Locale'
                : t(
                    parsed.sector === 'statale_ata'
                      ? 'sectorStataleAta'
                      : parsed.sector === 'statale_docente'
                      ? 'sectorStataleDocente'
                      : parsed.sector === 'paritaria_ata'
                      ? 'sectorParitariaAta'
                      : 'sectorParitariaDocente',
                  )}
            </span>
          )}
          {record.kind === 'service' && (typeof record.amount === 'number' && record.amount > 0 || parsed.weeklyHours) && (
            <span className="badge" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', fontWeight: 600 }}>
              <Clock size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: '-1px' }} />
              {typeof record.amount === 'number' && record.amount > 0 ? record.amount : parsed.weeklyHours}h/sett
            </span>
          )}
          {record.kind === 'service' && parsed.contractType && (
            <span className="badge" style={{ background: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}>
              {parsed.contractType === 'annual'
                ? 'Annuale (31 Ago)'
                : parsed.contractType === 'term'
                ? 'Termine Attività (30 Giu)'
                : parsed.contractType === 'permanent'
                ? 'Ruolo'
                : 'Supplenza Breve'}
            </span>
          )}
          {isLinked && (
            <span
              className="badge"
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                borderColor: '#bfdbfe',
                fontWeight: 600,
              }}
            >
              <Link2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
              {t('linkedPerson')}
            </span>
          )}
        </div>
        <h3>{record.title}</h3>
        <p>
          {record.start}
          {record.end ? ` → ${record.end}` : ''}
        </p>
        {record.school && (
          <p className="muted" style={{ fontSize: '12px', marginTop: 2 }}>
            {record.school.code} · {record.school.name} ({record.school.municipality} - {record.school.province})
          </p>
        )}
        {parsed.text && <p className="muted">{parsed.text}</p>}
      </div>
      <div className="actions">
        <button
          className="icon secondary"
          aria-label={t('edit')}
          disabled={busy || pending || isDrafting}
          onClick={() => onEdit(record)}
        >
          <Pencil size={17} />
        </button>
        <button
          className="icon secondary"
          aria-label={t('remove')}
          disabled={busy || pending || isDrafting}
          onClick={() => onRemove(record)}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
