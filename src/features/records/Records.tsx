import { useContext, useState } from 'react';
import { Plus, Trash2, Pencil, Briefcase, Link2, FileText } from 'lucide-react';
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
import { QualificationPresetSelector } from './QualificationPresetSelector';
import { IstanzeOnlineImportModal } from '../import/IstanzeOnlineImportModal';
import { RecordItemCard } from './RecordItemCard';
import { getTitleLabel, getTitlePlaceholder, getStartLabel } from './recordFormLabels';
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
  save,
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
  const [showImportModal, setShowImportModal] = useState(false);

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
        <div>
          <button
            type="button"
            className="secondary"
            style={{ marginRight: 8 }}
            disabled={busy || pending}
            onClick={() => setShowImportModal(true)}
            title="Importa la domanda presentata su Istanze Online (POLIS)"
          >
            <FileText size={16} />
            Importa Domanda POLIS
          </button>
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
                    onChange={event => {
                      const val = event.target.value;
                      setDraft({
                        ...draft,
                        profile: val,
                        notes: val === 'DOCENTE'
                          ? JSON.stringify({ ...parsedDraftNotes, sector: 'statale_docente' })
                          : draft.notes,
                      });
                    }}
                  >
                    {ATA_PROFILES.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.label}
                      </option>
                    ))}
                    <option value="DOCENTE">Personale Docente (Insegnante)</option>
                  </select>
                </FormField>
              )}

              {draft.kind === 'qualification' && (
                <QualificationPresetSelector
                  initialTitle={draft.title}
                  initialAmount={draft.amount}
                  initialNotes={draft.notes}
                  profile={draft.profile || person.profile}
                  onChange={data => {
                    setDraft({
                      ...draft,
                      title: data.title,
                      amount: data.amount,
                      notes: data.notes,
                      profile: data.profile !== undefined ? data.profile : draft.profile,
                    });
                  }}
                />
              )}

              <FormField
                label={getTitleLabel(draft.kind)}
                tip={draft.kind === 'service' ? t('tipServiceTitle') : undefined}
                status={getFieldStatus('title')}
                errorMessage={t('requiredField')}
              >
                <input
                  required
                  maxLength={160}
                  value={draft.title}
                  onChange={event => setDraft({ ...draft, title: event.target.value })}
                  placeholder={getTitlePlaceholder(draft.kind)}
                />
              </FormField>

              {draft.kind === 'qualification' && (
                <FormField
                  label="Punteggio Titolo (in decimi)"
                  tip="Punteggio ministeriale attribuito al titolo (es. 8.00 per voto 80/100, 1.00 per Dattilografia, 0 per CIAD)."
                >
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={draft.amount ?? ''}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        amount: event.target.value ? parseFloat(event.target.value) : null,
                      })
                    }
                    placeholder="es. 8.00"
                  />
                </FormField>
              )}

              <FormField
                label={getStartLabel(draft.kind)}
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
          entries.map(record => (
            <RecordItemCard
              key={record.id}
              record={record}
              busy={busy}
              pending={pending}
              isDrafting={draft !== null}
              onEdit={rec => {
                setFamilySource('manual');
                setDraft(rec);
              }}
              onRemove={rec => {
                if (window.confirm(t('deleteRecord'))) void persist(rec, true);
              }}
            />
          ))
        )}
      </div>

      {showImportModal && (
        <IstanzeOnlineImportModal
          currentPerson={person}
          onImportComplete={(updatedPerson, updatedArchive) => {
            context.saved(updatedArchive);
            save(updatedPerson);
            setShowImportModal(false);
          }}
          onClose={() => setShowImportModal(false)}
          busy={busy || pending}
        />
      )}
    </section>
  );
}
