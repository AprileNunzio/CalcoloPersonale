import { useContext, useState } from 'react';
import { Plus, Trash2, Pencil, Briefcase, Link2 } from 'lucide-react';
import { Archive, Entry, Person } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { AutoSaveContext, useAutoDraft, AutoSaveStatus } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { DirectoryPicker } from '../directory/DirectoryPicker';
import { FormField, FieldStatus } from '../../shared/FormField';
import { ATA_PROFILES, PROFILE_LABELS } from '../../shared/personUtils';
import { AbsenceInfoCard } from './AbsenceInfoCard';
import { ServiceDetailFields } from './ServiceDetailFields';
import { ServiceSector } from './serviceCalculations';
import { FamilyMemberPicker } from './FamilyMemberPicker';
import { detectContractType } from '../../shared/entitlements';
import './recordDetails.css';

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

function parseNotes(notes: string): { text: string; sector?: ServiceSector; linkedPersonId?: string } {
  try {
    if (notes.startsWith('{')) {
      return JSON.parse(notes);
    }
  } catch {
    return { text: notes };
  }
  return { text: notes };
}

export function Records({
  person,
  section,
  busy,
}: {
  person: Person;
  section: string;
  save: (p: Person) => void;
  busy: boolean;
}) {
  const t = useT();
  const context = useContext(AutoSaveContext)!;
  const [draft, setDraft] = useAutoDraft<Entry | null>(`entry:${person.id}:${section}`, null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [familySource, setFamilySource] = useState<'manual' | 'archive'>('manual');
  const [selectedLinkedId, setSelectedLinkedId] = useState('');

  const kinds = section === 'absences' ? absenceKinds : [section];
  const entries = person.records.filter(record => kinds.includes(record.kind));
  const otherPeople = (context.archive.people || []).filter(p => p.id !== person.id);

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
          profile: entry.kind === 'service' ? entry.profile || 'CS' : null,
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

  const handlePickArchivePerson = (chosen: Person | null) => {
    if (!draft) return;
    if (chosen) {
      setSelectedLinkedId(chosen.id);
      const payload = { linkedPersonId: chosen.id, role: 'family', text: draft.title || '' };
      setDraft({
        ...draft,
        title: `${chosen.lastName} ${chosen.firstName}`,
        start: chosen.birthDate || draft.start || '',
        notes: JSON.stringify(payload),
      });
    } else {
      setSelectedLinkedId('');
      setDraft({
        ...draft,
        title: '',
        notes: '',
      });
    }
  };

  const getFieldStatus = (field: keyof Entry): FieldStatus => {
    if (!draft) return 'idle';
    if (field === 'title') return draft.title.trim() ? 'saved' : 'idle';
    if (field === 'start') return draft.start ? 'saved' : 'idle';
    if (field === 'end') {
      if (!draft.end) return 'idle';
      return draft.end >= draft.start ? 'saved' : 'error';
    }
    if (field === 'profile') return draft.profile ? 'saved' : 'idle';
    if (field === 'notes') return draft.notes?.trim() ? 'saved' : 'idle';
    return 'idle';
  };

  const parsedDraftNotes = draft ? parseNotes(draft.notes) : { text: '' };
  const currentSector: ServiceSector = parsedDraftNotes.sector || 'statale_ata';

  const handleSectorChange = (sector: ServiceSector) => {
    if (!draft) return;
    const updated = { ...parsedDraftNotes, sector };
    setDraft({ ...draft, notes: JSON.stringify(updated) });
  };

  const handleNotesTextChange = (text: string) => {
    if (!draft) return;
    if (draft.kind === 'service' || parsedDraftNotes.linkedPersonId) {
      const updated = { ...parsedDraftNotes, text };
      setDraft({ ...draft, notes: JSON.stringify(updated) });
    } else {
      setDraft({ ...draft, notes: text });
    }
  };

  return (
    <section>
      <div className="section-heading">
        <h2>{t(section)}</h2>
        <button
          disabled={busy || pending || draft !== null}
          onClick={() => {
            setFamilySource('manual');
            setSelectedLinkedId('');
            setDraft({
              id: crypto.randomUUID(),
              kind: kinds[0],
              title: '',
              start: '',
              end: null,
              amount: null,
              notes: '',
              profile: kinds[0] === 'service' ? 'CS' : null,
            });
          }}
        >
          <Plus size={18} />
          {t('addRecord')}
        </button>
      </div>

      {error && (
        <p role="alert" className="error">
          {t(error)}
        </p>
      )}

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

            {draft.kind === 'child' && (
              <FamilyMemberPicker
                otherPeople={otherPeople}
                selectedPersonId={selectedLinkedId || parsedDraftNotes.linkedPersonId || ''}
                onSelect={handlePickArchivePerson}
                source={familySource}
                onSourceChange={setFamilySource}
              />
            )}

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
                <strong>
                  {draft.school.code} · {draft.school.name}
                </strong>
                <p>
                  {draft.school.address} · {draft.school.postalCode} · {draft.school.municipality} · {draft.school.province}
                </p>
                <p>
                  {draft.school.email} · {draft.school.pec} · {draft.school.website}
                </p>
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
                      <option key={kind} value={kind}>
                        {t(kind)}
                      </option>
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
                errorMessage={t('requiredField')}
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
                  errorMessage={t('invalidField')}
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

              {draft.kind === 'service' && (
                <div className="wide" style={{ gridColumn: '1 / -1' }}>
                  <ServiceDetailFields
                    start={draft.start}
                    end={draft.end}
                    profile={draft.profile || 'CS'}
                    sector={currentSector}
                    notes={draft.notes}
                    onChangeSector={handleSectorChange}
                  />
                </div>
              )}

              <FormField
                label={t('notes')}
                tip={draft.kind === 'service' ? t('tipServiceNotes') : undefined}
                status={getFieldStatus('notes')}
                className="wide"
              >
                <input
                  maxLength={2000}
                  value={parsedDraftNotes.text ?? draft.notes}
                  onChange={event => handleNotesTextChange(event.target.value)}
                  placeholder="Note opzionali..."
                />
              </FormField>
            </div>

            {section === 'absences' && (
              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <AbsenceInfoCard
                  kind={draft.kind}
                  defaultContractType={detectContractType(person)}
                />
              </div>
            )}

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
          entries.map(record => {
            const parsed = parseNotes(record.notes);
            const isLinked = !!parsed.linkedPersonId;

            return (
              <article className="entry" key={record.id}>
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
                        {t(
                          parsed.sector === 'statale_ata'
                            ? 'sectorStataleAta'
                            : parsed.sector === 'statale_docente'
                            ? 'sectorStataleDocente'
                            : parsed.sector === 'paritaria_ata'
                            ? 'sectorParitariaAta'
                            : 'sectorParitariaDocente'
                        )}
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
                  {parsed.text && (
                    <p className="muted">{parsed.text}</p>
                  )}
                </div>
                <div className="actions">
                  <button
                    className="icon secondary"
                    aria-label={t('edit')}
                    disabled={busy || pending || draft !== null}
                    onClick={() => {
                      setFamilySource('manual');
                      setDraft(record);
                    }}
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
            );
          })
        )}
      </div>
    </section>
  );
}
