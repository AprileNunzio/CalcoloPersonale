import { useContext, useState } from 'react';
import { Plus, Trash2, Pencil, Briefcase } from 'lucide-react';
import { Archive, Entry, Person } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { AutoSaveContext, useAutoDraft, AutoSaveStatus } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { DirectoryPicker } from '../directory/DirectoryPicker';
import { FormField, FieldStatus } from '../../shared/FormField';
import { ATA_PROFILES, PROFILE_LABELS } from '../../shared/personUtils';

const absenceKinds = ['sickness', 'parental', 'holiday', 'festivity', 'bereavement', 'blood', 'other'];

export function Records({ person, section, busy }: { person: Person; section: string; save: (p: Person) => void; busy: boolean }) {
  const t = useT();
  const context = useContext(AutoSaveContext)!;
  const [draft, setDraft] = useAutoDraft<Entry | null>(`entry:${person.id}:${section}`, null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const kinds = section === 'absences' ? absenceKinds : [section];
  const entries = person.records.filter(record => kinds.includes(record.kind));

  async function persist(entry: Entry, remove = false) {
    setPending(true);
    setError('');
    try {
      await flush();
      const archive = await call<Archive>(remove ? 'delete_record' : 'save_record', {
        personId: person.id,
        entryId: entry.id,
        entry: {
          ...entry,
          profile: entry.kind === 'service' ? (entry.profile || 'CS') : null,
        },
        revision: getRevision(),
      });
      context.saved(archive);
      if (!remove || draft?.id === entry.id) setDraft(null);
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'error');
    } finally {
      setPending(false);
    }
  }

  const getFieldStatus = (field: keyof Entry): FieldStatus => {
    if (!draft) return 'idle';
    if (field === 'title') {
      return draft.title.trim() ? 'saved' : 'idle';
    }
    if (field === 'start') {
      return draft.start ? 'saved' : 'idle';
    }
    if (field === 'end') {
      if (!draft.end) return 'idle';
      return draft.end >= draft.start ? 'saved' : 'error';
    }
    if (field === 'profile') {
      return draft.profile ? 'saved' : 'idle';
    }
    if (field === 'notes') {
      return draft.notes?.trim() ? 'saved' : 'idle';
    }
    return 'idle';
  };

  return (
    <section>
      <div className="section-heading">
        <h2>{t(section)}</h2>
        <button
          disabled={busy || pending || draft !== null}
          onClick={() =>
            setDraft({
              id: crypto.randomUUID(),
              kind: kinds[0],
              title: '',
              start: '',
              end: null,
              amount: null,
              notes: '',
              profile: kinds[0] === 'service' ? 'CS' : null,
            })
          }
        >
          <Plus size={18} />
          {t('addRecord')}
        </button>
      </div>

      {error && <p role="alert" className="error">{t(error)}</p>}

      {draft && (
        <form
          className="panel form"
          onSubmit={event => {
            event.preventDefault();
            void persist(draft);
          }}
        >
          <fieldset className="application-boundary" disabled={pending || busy}>
            <div className="form-panel-header">
              <div>
                <h2>{draft.id ? t('edit') : t('addRecord')}</h2>
              </div>
              <AutoSaveStatus />
            </div>

            {draft.kind === 'service' && (
              <div style={{ marginBottom: 20 }}>
                <FormField
                  label={t('schoolSearch')}
                  tip={t('tipServiceSchool')}
                  className="wide"
                >
                  <DirectoryPicker
                    kind="school"
                    onSelect={school =>
                      setDraft({
                        ...draft,
                        school,
                        title: draft.title || school.name,
                      })
                    }
                  />
                </FormField>
              </div>
            )}

            {draft.school && (
              <div className="school-summary" style={{ marginBottom: 18 }}>
                <strong>{draft.school.code} · {draft.school.name}</strong>
                <p>{draft.school.address} · {draft.school.postalCode} · {draft.school.municipality} · {draft.school.province}</p>
                <p>{draft.school.email} · {draft.school.pec} · {draft.school.website}</p>
              </div>
            )}

            <div className="fields">
              {kinds.length > 1 && (
                <FormField label={t('kind')}>
                  <select
                    value={draft.kind}
                    onChange={event => setDraft({ ...draft, kind: event.target.value })}
                  >
                    {kinds.map(kind => (
                      <option key={kind} value={kind}>{t(kind)}</option>
                    ))}
                  </select>
                </FormField>
              )}

              {draft.kind === 'service' && (
                <FormField
                  label={t('profile')}
                  tip={t('tipServiceProfile')}
                  status={getFieldStatus('profile')}
                >
                  <select
                    value={draft.profile || 'CS'}
                    onChange={event => setDraft({ ...draft, profile: event.target.value })}
                  >
                    {ATA_PROFILES.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField
                label={t('title')}
                tip={draft.kind === 'service' ? t('tipServiceTitle') : undefined}
                status={getFieldStatus('title')}
                errorMessage="Il titolo/descrizione è obbligatorio"
              >
                <input
                  required
                  maxLength={160}
                  value={draft.title}
                  onChange={event => setDraft({ ...draft, title: event.target.value })}
                  placeholder={draft.kind === 'service' ? 'es. Contratto 30 giugno / supplenza' : ''}
                />
              </FormField>

              <FormField
                label={t('start')}
                tip={draft.kind === 'service' ? t('tipServiceStart') : undefined}
                status={getFieldStatus('start')}
              >
                <input
                  required
                  type="date"
                  value={draft.start}
                  onChange={event => setDraft({ ...draft, start: event.target.value })}
                />
              </FormField>

              {draft.kind !== 'child' && (
                <FormField
                  label={t('end')}
                  tip={draft.kind === 'service' ? t('tipServiceEnd') : undefined}
                  status={getFieldStatus('end')}
                  errorMessage="La data di fine non può precedere la data di inizio"
                >
                  <input
                    type="date"
                    min={draft.start}
                    value={draft.end ?? ''}
                    onChange={event =>
                      setDraft({ ...draft, end: event.target.value || null })
                    }
                  />
                </FormField>
              )}

              <FormField
                label={t('notes')}
                tip={draft.kind === 'service' ? t('tipServiceNotes') : undefined}
                status={getFieldStatus('notes')}
                className="wide"
              >
                <input
                  maxLength={2000}
                  value={draft.notes}
                  onChange={event => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="Note opzionali..."
                />
              </FormField>
            </div>

            <div className="actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setDraft(null)}
              >
                {t('closeForm')}
              </button>
              <button type="submit">{t('save')}</button>
            </div>
          </fieldset>
        </form>
      )}

      <div className="panel entries">
        {entries.length === 0 ? (
          <p className="muted">{t('noRecords')}</p>
        ) : (
          entries.map(record => (
            <article className="entry" key={record.id}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 4 }}>
                  <span className="badge">{t(record.kind)}</span>
                  {record.kind === 'service' && record.profile && (
                    <span className="badge" style={{ background: '#eaf4f1', color: '#166e61', borderColor: '#c4e3dc', fontWeight: 600 }}>
                      <Briefcase size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                      {record.profile} · {PROFILE_LABELS[record.profile] || record.profile}
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
                {record.notes && <p className="muted">{record.notes}</p>}
              </div>
              <div className="actions">
                <button
                  className="icon secondary"
                  aria-label={t('edit')}
                  disabled={busy || pending || draft !== null}
                  onClick={() => setDraft(record)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon secondary"
                  aria-label={t('remove')}
                  disabled={busy || pending || draft !== null}
                  onClick={() => {
                    if (window.confirm(t('deleteRecord'))) void persist(record, true);
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
