import { useContext, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Archive, Entry, Person } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { AutoSaveContext, useAutoDraft, AutoSaveStatus } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { DirectoryPicker } from '../directory/DirectoryPicker';

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
        personId: person.id, entryId: entry.id, entry, revision: getRevision(),
      });
      context.saved(archive);
      if (!remove || draft?.id === entry.id) setDraft(null);
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'error');
    } finally {
      setPending(false);
    }
  }

  return <section>
    <div className="section-heading">
      <h2>{t(section)}</h2>
      <button disabled={busy || pending || draft !== null} onClick={() => setDraft({ id: crypto.randomUUID(), kind: kinds[0], title: '', start: '', end: null, amount: null, notes: '' })}>
        <Plus size={18}/>{t('addRecord')}
      </button>
    </div>
    {error && <p role="alert" className="error">{t(error)}</p>}
    {draft && <form className="panel form" onSubmit={event => { event.preventDefault(); void persist(draft); }}>
      <fieldset className="application-boundary" disabled={pending || busy}>
        <AutoSaveStatus/>
        {draft.kind === 'service' && <DirectoryPicker kind="school" onSelect={school => setDraft({ ...draft, school, title: school.name })}/>}
        {draft.school && <div className="school-summary">
          <strong>{draft.school.code} · {draft.school.name}</strong>
          <p>{draft.school.address} · {draft.school.postalCode} · {draft.school.municipality} · {draft.school.province}</p>
          <p>{draft.school.email} · {draft.school.pec} · {draft.school.website}</p>
        </div>}
        <div className="fields">
          <label>{t('kind')}<select value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value })}>
            {kinds.map(kind => <option key={kind} value={kind}>{t(kind)}</option>)}
          </select></label>
          <label>{t('title')}<input required maxLength={160} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })}/></label>
          <label>{t('start')}<input required type="date" value={draft.start} onChange={event => setDraft({ ...draft, start: event.target.value })}/></label>
          {draft.kind !== 'child' && <label>{t('end')}<input type="date" min={draft.start} value={draft.end ?? ''} onChange={event => setDraft({ ...draft, end: event.target.value || null })}/></label>}
          <label className="wide">{t('notes')}<input maxLength={2000} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })}/></label>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setDraft(null)}>{t('closeForm')}</button>
          <button>{t('save')}</button>
        </div>
      </fieldset>
    </form>}
    <div className="panel entries">
      {entries.length === 0 ? <p className="muted">{t('noRecords')}</p> : entries.map(record => <article className="entry" key={record.id}>
        <div><span className="badge">{t(record.kind)}</span><h3>{record.title}</h3>
          <p>{record.start}{record.end ? ` → ${record.end}` : ''}</p>
          {record.notes && <p className="muted">{record.notes}</p>}
        </div>
        <div className="actions">
          <button className="icon secondary" aria-label={t('edit')} disabled={busy || pending || draft !== null} onClick={() => setDraft(record)}><Pencil size={17}/></button>
          <button className="icon secondary" aria-label={t('remove')} disabled={busy || pending || draft !== null} onClick={() => { if (window.confirm(t('deleteRecord'))) void persist(record, true); }}><Trash2 size={17}/></button>
        </div>
      </article>)}
    </div>
  </section>;
}
