import { useState } from 'react';
import { useAutoDraft, AutoSaveStatus } from '../autosave/AutoSave';
import { DirectoryPicker } from '../directory/DirectoryPicker';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
export function PersonForm({ person, onSave, onCancel, busy }: { person?: Person; onSave: (p: Person) => void; onCancel: () => void; busy: boolean }) {
  const t = useT();
  const [id] = useState(person?.id ?? crypto.randomUUID());
  const [value, setValue] = useAutoDraft<Person>(`person:${id}`, person ?? { id, firstName:'', lastName:'', gender:'female', birthDate:null, fiscalCode:'', profile:'CS', records:[] });
  const field = (name: 'firstName'|'lastName'|'fiscalCode'|'birthDate', type = 'text') => <label>{t(name)}<input type={type} value={value[name] ?? ''} required={name === 'firstName' || name === 'lastName'} maxLength={name === 'fiscalCode' ? 16 : 80} onChange={e => setValue({...value, [name]: name === 'birthDate' ? e.target.value || null : name === 'fiscalCode' ? e.target.value.toUpperCase() : e.target.value})}/></label>;
  return <form className="panel form" onSubmit={e => { e.preventDefault(); onSave(value); }}><h2>{t(person ? 'identity' : 'add')}</h2><AutoSaveStatus/><DirectoryPicker kind="municipality" onSelect={municipality=>setValue({...value,municipality})}/>{value.municipality && <p className="muted">{value.municipality.name} · {value.municipality.province} · {value.municipality.region}</p>}<div className="fields">{field('firstName')}{field('lastName')}{field('birthDate','date')}{field('fiscalCode')}<label>{t('gender')}<select value={value.gender} onChange={e => setValue({...value, gender:e.target.value})}>{['female','male','other'].map(k => <option key={k} value={k}>{t(k)}</option>)}</select></label><label>{t('profile')}<select value={value.profile} onChange={e => setValue({...value, profile:e.target.value})}>{['AA','AT','CS','CO','IF','GA','OS'].map(k => <option key={k}>{k}</option>)}</select></label></div><div className="actions"><button type="button" className="secondary" onClick={onCancel}>{t('cancel')}</button><button disabled={busy}>{t('save')}</button></div></form>;
}
