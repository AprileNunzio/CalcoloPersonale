import { useContext, useEffect, useState, useRef } from 'react';
import { AutoSaveContext, useAutoDraft, AutoSaveStatus } from '../autosave/AutoSave';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FormField, FieldStatus } from '../../shared/FormField';
import { call } from '../../shared/api';
import type { DirectoryEntry } from '../directory/DirectoryPicker';
import './PersonForm.css';

export function PersonForm({
  person,
  onSave,
  onCancel,
  busy,
}: {
  person?: Person;
  onSave: (p: Person) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const t = useT();
  const context = useContext(AutoSaveContext)!;
  const lastNameRef = useRef<HTMLInputElement>(null);

  const [id] = useState(
    () =>
      person?.id ??
      Object.keys(context.archive.drafts)
        .find(
          key =>
            key.startsWith('person:') &&
            !context.archive.people.some(item => `person:${item.id}` === key),
        )
        ?.slice(7) ??
      crypto.randomUUID(),
  );

  const [value, setValue] = useAutoDraft<Person>(
    `person:${id}`,
    person ?? {
      id,
      firstName: '',
      lastName: '',
      gender: 'female',
      birthDate: null,
      birthPlace: '',
      birthProvince: '',
      fiscalCode: '',
      profile: '',
      records: [],
    },
  );

  const [muniQuery, setMuniQuery] = useState(value.birthPlace || value.municipality?.name || '');
  const [muniResults, setMuniResults] = useState<DirectoryEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lastNameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (value.birthPlace && muniQuery !== value.birthPlace) {
      setMuniQuery(value.birthPlace);
    }
  }, [value.birthPlace]);

  useEffect(() => {
    let active = true;
    if (muniQuery.trim().length < 2 || !showDropdown) {
      setMuniResults([]);
      return;
    }
    const timer = setTimeout(() => {
      call<DirectoryEntry[]>('search_directory', {
        kind: 'municipality',
        query: muniQuery.trim(),
      })
        .then(results => {
          if (active) setMuniResults(results.slice(0, 10));
        })
        .catch(() => {
          if (active) setMuniResults([]);
        });
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [muniQuery, showDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMunicipality = (entry: DirectoryEntry) => {
    setValue({
      ...value,
      birthPlace: entry.name,
      birthProvince: entry.province,
      municipality: entry,
    });
    setMuniQuery(entry.name);
    setShowDropdown(false);
  };

  const getStatus = (name: keyof Person): FieldStatus => {
    const val = value[name];
    if (name === 'lastName' || name === 'firstName') {
      if (typeof val === 'string' && val.trim().length > 0) return 'saved';
      return val ? 'error' : 'idle';
    }
    if (name === 'birthDate') {
      if (!val) return 'idle';
      const today = new Date().toISOString().slice(0, 10);
      return (val as string) <= today ? 'saved' : 'error';
    }
    if (name === 'fiscalCode') {
      const code = (val as string) || '';
      if (!code) return 'idle';
      const isValid = /^[A-Z0-9]{16}$/.test(code);
      return isValid ? 'saved' : 'error';
    }
    if (name === 'birthPlace' || name === 'birthProvince') {
      return (val as string)?.trim() ? 'saved' : 'idle';
    }
    if (name === 'gender') {
      return 'saved';
    }
    return 'idle';
  };

  return (
    <form
      className="panel form person-form"
      onSubmit={e => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <div className="form-panel-header">
        <div>
          <h2>{t(person ? 'identity' : 'add')}</h2>
          <p className="muted">{t('intro')}</p>
        </div>
        <AutoSaveStatus />
      </div>

      <div className="person-fields-grid">
        <FormField
          label={t('lastName')}
          tip={t('tipLastName')}
          status={getStatus('lastName')}
          errorMessage={t('requiredField')}
        >
          <input
            ref={lastNameRef}
            type="text"
            required
            maxLength={80}
            value={value.lastName || ''}
            onChange={e => setValue({ ...value, lastName: e.target.value })}
            placeholder={t('placeholderLastName')}
          />
        </FormField>

        <FormField
          label={t('firstName')}
          tip={t('tipFirstName')}
          status={getStatus('firstName')}
          errorMessage={t('requiredField')}
        >
          <input
            type="text"
            required
            maxLength={80}
            value={value.firstName || ''}
            onChange={e => setValue({ ...value, firstName: e.target.value })}
            placeholder={t('placeholderFirstName')}
          />
        </FormField>

        <FormField
          label={t('birthDate')}
          tip={t('tipBirthDate')}
          status={getStatus('birthDate')}
          errorMessage={t('invalidField')}
        >
          <input
            type="date"
            value={value.birthDate || ''}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setValue({ ...value, birthDate: e.target.value || null })}
          />
        </FormField>

        <div className="birth-place-container" ref={dropdownRef}>
          <FormField
            label={t('birthPlace')}
            tip={t('tipBirthPlace')}
            status={getStatus('birthPlace')}
          >
            <input
              type="text"
              autoComplete="off"
              value={muniQuery}
              onChange={e => {
                setMuniQuery(e.target.value);
                setValue({ ...value, birthPlace: e.target.value });
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (muniQuery.trim().length >= 2) setShowDropdown(true);
              }}
              placeholder={t('placeholderBirthPlace')}
            />
          </FormField>
          {showDropdown && muniResults.length > 0 && (
            <ul className="istat-suggestions" role="listbox">
              {muniResults.map(entry => (
                <li
                  key={`${entry.code}-${entry.name}`}
                  role="option"
                  onClick={() => handleSelectMunicipality(entry)}
                >
                  <strong>{entry.name}</strong>
                  <span className="prov-badge">({entry.province})</span>
                  <small>{entry.region}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FormField
          label={t('birthProvince')}
          tip={t('tipBirthProvince')}
          status={getStatus('birthProvince')}
        >
          <input
            type="text"
            maxLength={5}
            value={value.birthProvince || ''}
            onChange={e =>
              setValue({ ...value, birthProvince: e.target.value.toUpperCase() })
            }
            placeholder="RM / EE"
          />
        </FormField>

        <FormField
          label={t('gender')}
          tip={t('tipGender')}
          status={getStatus('gender')}
        >
          <select
            value={value.gender || 'female'}
            onChange={e => setValue({ ...value, gender: e.target.value })}
          >
            <option value="female">{t('female')}</option>
            <option value="male">{t('male')}</option>
            <option value="other">{t('other')}</option>
          </select>
        </FormField>

        <FormField
          label={t('fiscalCode')}
          tip={t('tipFiscalCode')}
          status={getStatus('fiscalCode')}
          errorMessage={t('invalidField')}
          className="wide"
        >
          <input
            type="text"
            maxLength={16}
            value={value.fiscalCode || ''}
            onChange={e =>
              setValue({ ...value, fiscalCode: e.target.value.toUpperCase().replace(/\s+/g, '') })
            }
            placeholder={t('placeholderFiscalCode')}
          />
        </FormField>
      </div>

      <div className="actions">
        <button type="button" className="secondary" onClick={onCancel}>
          {t('cancel')}
        </button>
        <button disabled={busy} type="submit">
          {t('save')}
        </button>
      </div>
    </form>
  );
}
