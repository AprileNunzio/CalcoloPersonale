import { useContext, useState } from 'react';
import { Plus, Briefcase, FileText } from 'lucide-react';
import { Archive, Entry, Person } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { AutoSaveContext, useAutoDraft } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { IstanzeOnlineImportModal } from '../import/IstanzeOnlineImportModal';
import { RecordItemCard } from './RecordItemCard';
import { RecordEditForm } from './RecordEditForm';
import { QualificationSummaryPanel } from '../qualifications/QualificationSummaryPanel';
import { AbsenceComportoPanel } from '../absences/AbsenceComportoPanel';
import './recordDetails.css';

const absenceKinds = ['sickness', 'specialist', 'parental', 'holiday', 'festivity', 'bereavement', 'personal', 'law104', 'blood', 'study', 'marriage', 'other'];

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
  const [isExplicitlyAdding, setIsExplicitlyAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [familySource, setFamilySource] = useState<'manual' | 'archive'>('manual');
  const [selectedLinkedId, setSelectedLinkedId] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const isEditingExisting = Boolean(draft?.id && person.records.some(r => r.id === draft.id));
  const hasDraftContent = draft !== null && Boolean(
    isEditingExisting || draft.title?.trim() || draft.school || draft.start
  );
  const isFormOpen = isExplicitlyAdding || hasDraftContent;

  const kinds = section === 'absences' ? absenceKinds : [section];
  const entries = person.records
    .filter(record => kinds.includes(record.kind))
    .sort((a, b) => {
      const dateA = a.start || '';
      const dateB = b.start || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.end || '').localeCompare(a.end || '');
    });
  const otherPeople = (context.archive.people || []).filter(p => p.id !== person.id);

  async function persist(entry: Entry, remove = false) {
    setPending(true);
    setError('');
    try {
      await flush();
      const validId = entry.id && entry.id.trim().length > 0 ? entry.id.trim() : crypto.randomUUID();
      const entryToSave: Entry = {
        ...entry,
        id: validId,
        profile: entry.kind === 'service' ? entry.profile || 'CS' : null,
      };
      const archive = await call<Archive>(remove ? 'delete_record' : 'save_record', {
        personId: person.id,
        entryId: validId,
        entry: entryToSave,
        revision: getRevision(),
      });
      context.saved(archive);
      if (!remove || draft?.id === entry.id) {
        setDraft(null);
        setIsExplicitlyAdding(false);
      }
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
        start: '',
        notes: '',
      });
    }
  };

  return (
    <section className="records">
      <div className="records-header">
        <div className="records-header-text">
          <h1>{t(section)}</h1>
          <p className="muted">{t(`${section}Description`)}</p>
        </div>

        <div className="records-header-actions">
          {section === 'service' && (
            <button
              type="button"
              className="records-btn-secondary"
              onClick={() => setShowImportModal(true)}
              disabled={busy || pending}
            >
              <FileText size={16} />
              <span>Importa PDF Istanze Online</span>
            </button>
          )}

          <button
            type="button"
            className="records-btn-primary"
            disabled={busy || pending || isFormOpen}
            onClick={() => {
              setIsExplicitlyAdding(true);
              setFamilySource('manual');
              setSelectedLinkedId('');
              setDraft({
                id: crypto.randomUUID(),
                kind: kinds[0],
                school: null,
                title: '',
                start: '',
                end: null,
                amount: null,
                notes: '',
                profile: section === 'service' ? person.profile || 'CS' : null,
              });
            }}
          >
            <Plus size={16} />
            <span>
              {section === 'service'
                ? t('addService')
                : section === 'qualification'
                ? t('addQualification')
                : section === 'absences'
                ? t('addAbsence')
                : t('add')}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="error">
          {t(error)}
        </p>
      )}

      {isFormOpen && draft && (
        <RecordEditForm
          draft={draft}
          setDraft={d => {
            setDraft(d);
            if (!d) setIsExplicitlyAdding(false);
          }}
          person={person}
          section={section}
          kinds={kinds}
          pending={pending}
          busy={busy}
          otherPeople={otherPeople}
          familySource={familySource}
          setFamilySource={setFamilySource}
          selectedLinkedId={selectedLinkedId}
          onPickArchivePerson={handlePickArchivePerson}
          onSubmit={entry => void persist(entry)}
        />
      )}

      {section === 'qualification' && <QualificationSummaryPanel person={person} />}
      {section === 'absences' && <AbsenceComportoPanel person={person} />}

      <div className="records-list">
        {entries.length === 0 ? (
          <div className="records-empty-card">
            <p className="muted" style={{ margin: 0 }}>{t('noRecords')}</p>
          </div>
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
