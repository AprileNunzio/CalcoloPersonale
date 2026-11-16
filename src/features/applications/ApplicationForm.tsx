import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Entry, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FormField } from '../../shared/FormField';
import { ATA_PROFILES } from '../../shared/personUtils';
import { ProfileBadge3d } from '../../shared/icons3d';
import { ApplicationData, TRIENNIUMS } from './types';
import { DirectoryPicker, DirectoryEntry } from '../directory/DirectoryPicker';

export function ApplicationForm({
  person,
  entry,
  onSave,
  onCancel,
  busy,
}: {
  person: Person;
  entry?: Entry;
  onSave: (record: Entry) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const t = useT();

  let initialData: ApplicationData = {
    triennium: TRIENNIUMS[0],
    profiles: ['CS'],
    applicationType: 'insert',
    submissionDate: new Date().toISOString().slice(0, 10),
    protocol: '',
    province: person.birthProvince || 'RM',
    headSchool: null,
    chosenSchools: [],
    declaredAccess: '',
    declaredCultural: '',
    declaredServices: '',
    notes: '',
  };

  if (entry) {
    try {
      if (entry.notes.startsWith('{')) {
        const parsed = JSON.parse(entry.notes);
        initialData = { ...initialData, ...parsed };
      } else {
        initialData.notes = entry.notes;
      }
    } catch {
      initialData.notes = entry.notes;
    }
  }

  const [formData, setFormData] = useState<ApplicationData>(initialData);

  const addChosenSchool = (school: DirectoryEntry) => {
    setFormData(prev => {
      const current = prev.chosenSchools || [];
      if (current.some(s => s.code === school.code)) {
        return prev;
      }
      if (current.length >= 30) {
        return prev;
      }
      return { ...prev, chosenSchools: [...current, school] };
    });
  };

  const removeChosenSchool = (code: string) => {
    setFormData(prev => ({
      ...prev,
      chosenSchools: (prev.chosenSchools || []).filter(s => s.code !== code),
    }));
  };

  const toggleProfile = (code: string) => {
    setFormData(prev => {
      const exists = prev.profiles.includes(code);
      const next = exists ? prev.profiles.filter(p => p !== code) : [...prev.profiles, code];
      return { ...prev, profiles: next.length > 0 ? next : [code] };
    });
  };

  const handleAutoImport = () => {
    const titles = person.records.filter(r => r.kind === 'title');
    const services = person.records.filter(r => r.kind === 'service');

    const accessTitles = titles.filter(t => 
      t.notes?.toLowerCase().includes('accesso') || 
      t.title.toLowerCase().includes('diploma') || 
      t.title.toLowerCase().includes('laurea')
    );
    const culturalTitles = titles.filter(t => !accessTitles.includes(t));

    const accessStr = accessTitles.length > 0
      ? accessTitles.map(t => `${t.title}${t.start ? ` (${t.start})` : ''}`).join('; ')
      : (titles[0] ? `${titles[0].title}${titles[0].start ? ` (${titles[0].start})` : ''}` : '');

    const culturalStr = (accessTitles.length > 0 ? culturalTitles : titles.slice(1))
      .map(t => `${t.title}${t.notes ? ` - ${t.notes}` : ''}`)
      .join('; ');

    const serviceStr = services.map(s => {
      const prof = s.profile ? ` [${s.profile}]` : '';
      const dates = s.start ? ` (${s.start}${s.end ? ` → ${s.end}` : ''})` : '';
      const school = s.school ? ` c/o ${s.school.name}` : '';
      return `${s.title}${prof}${dates}${school}`;
    }).join('\n');

    setFormData(prev => ({
      ...prev,
      declaredAccess: prev.declaredAccess || accessStr,
      declaredCultural: prev.declaredCultural || culturalStr,
      declaredServices: prev.declaredServices || serviceStr,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const jsonNotes = JSON.stringify(formData);
    const updatedRecord: Entry = {
      id: entry?.id ?? crypto.randomUUID(),
      kind: 'application',
      title: `${formData.triennium.split(' ')[0]} - ${formData.profiles.join(', ')}`,
      start: formData.submissionDate || new Date().toISOString().slice(0, 10),
      end: null,
      amount: null,
      notes: jsonNotes,
      profile: formData.profiles[0] || null,
      school: formData.headSchool || null,
    };
    onSave(updatedRecord);
  };

  return (
    <form className="panel form app-form" onSubmit={handleSubmit}>
      <div className="section-heading">
        <div>
          <h2>{t(entry ? 'edit' : 'newApplication')}</h2>
          <p className="muted">{t('addApplicationHelp')}</p>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={handleAutoImport}
          title={t('autoImportTip')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Sparkles size={16} />
          {t('autoImportFromDossier')}
        </button>
      </div>

      <div className="fields app-fields">
        <FormField label={t('triennium')} tip={t('tipTriennium')}>
          <select
            value={formData.triennium}
            onChange={e => setFormData({ ...formData, triennium: e.target.value })}
          >
            {TRIENNIUMS.map(tri => (
              <option key={tri} value={tri}>
                {tri}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('applicationType')}>
          <select
            value={formData.applicationType}
            onChange={e =>
              setFormData({
                ...formData,
                applicationType: e.target.value as 'insert' | 'update',
              })
            }
          >
            <option value="insert">{t('newInclusion')}</option>
            <option value="update">{t('updateConfirmation')}</option>
          </select>
        </FormField>

        <div className="wide-field profiles-selector-field">
          <label className="field-label-text">{t('profilesChosen')}</label>
          <div className="profile-chips-group">
            {ATA_PROFILES.map(prof => {
              const selected = formData.profiles.includes(prof.code);
              return (
                <button
                  type="button"
                  key={prof.code}
                  className={`profile-chip-btn ${selected ? 'active' : ''}`}
                  onClick={() => toggleProfile(prof.code)}
                >
                  <ProfileBadge3d code={prof.code} size={28} />
                  <span>{prof.code}</span>
                  <small>{prof.label.split('(')[0].trim()}</small>
                </button>
              );
            })}
          </div>
        </div>

        <FormField label={t('submissionDate')}>
          <input
            type="date"
            value={formData.submissionDate}
            onChange={e => setFormData({ ...formData, submissionDate: e.target.value })}
          />
        </FormField>

        <FormField label={t('protocolNumber')} tip={t('tipProtocol')}>
          <input
            type="text"
            value={formData.protocol}
            onChange={e => setFormData({ ...formData, protocol: e.target.value })}
            placeholder="es. MIIC8XXXXX-2024-00123"
          />
        </FormField>

        <FormField label={t('province')}>
          <input
            type="text"
            maxLength={10}
            value={formData.province}
            onChange={e => setFormData({ ...formData, province: e.target.value.toUpperCase() })}
            placeholder="es. RM, MI, NA"
          />
        </FormField>

        <div className="wide-field">
          <label className="field-label-text">{t('headSchool')}</label>
          {formData.headSchool ? (
            <div className="app-selected-school">
              <div>
                <strong>{formData.headSchool.name}</strong>
                <small>{formData.headSchool.code} · {formData.headSchool.municipality} ({formData.headSchool.province})</small>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setFormData({ ...formData, headSchool: null })}
              >
                {t('edit')}
              </button>
            </div>
          ) : (
            <DirectoryPicker
              kind="school"
              onSelect={(school: DirectoryEntry) =>
                setFormData({ ...formData, headSchool: school })
              }
            />
          )}
        </div>

        <div className="wide-field chosen-schools-section">
          <div className="chosen-schools-header">
            <div>
              <label className="field-label-text">{t('chosenSchoolsTitle')}</label>
              <p className="field-hint-text">{t('chosenSchoolsSubtitle')}</p>
            </div>
            <span className={`chosen-count-pill ${(formData.chosenSchools?.length || 0) >= 30 ? 'limit-reached' : ''}`}>
              {formData.chosenSchools?.length || 0} / 30 {t('schoolsSelected')}
            </span>
          </div>

          {(formData.chosenSchools?.length || 0) < 30 ? (
            <div className="chosen-schools-picker-box">
              <DirectoryPicker
                kind="school"
                onSelect={addChosenSchool}
              />
            </div>
          ) : (
            <div className="max-schools-alert">
              <span>{t('maxSchoolsReached')}</span>
            </div>
          )}

          {formData.chosenSchools && formData.chosenSchools.length > 0 && (
            <div className="chosen-schools-grid">
              {formData.chosenSchools.map((school, index) => (
                <div key={school.code} className="chosen-school-card">
                  <div className="chosen-school-badge">{index + 1}</div>
                  <div className="chosen-school-meta">
                    <strong>{school.name}</strong>
                    <small>{school.code} · {school.municipality} ({school.province})</small>
                  </div>
                  <button
                    type="button"
                    className="chosen-school-del-btn"
                    onClick={() => removeChosenSchool(school.code)}
                    title={t('removeSchool')}
                    aria-label={t('removeSchool')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="wide-field">
          <FormField label={t('declaredAccessTitles')}>
            <input
              type="text"
              value={formData.declaredAccess}
              onChange={e => setFormData({ ...formData, declaredAccess: e.target.value })}
              placeholder="es. Diploma di Maturità votazione 84/100 conseguito nel 2012"
            />
          </FormField>
        </div>

        <div className="wide-field">
          <FormField label={t('declaredCulturalTitles')}>
            <input
              type="text"
              value={formData.declaredCultural}
              onChange={e => setFormData({ ...formData, declaredCultural: e.target.value })}
              placeholder="es. Certificazione Internazionale di Alfabetizzazione Digitale (CIAD), Dattilografia"
            />
          </FormField>
        </div>

        <div className="wide-field">
          <FormField label={t('declaredServices')}>
            <textarea
              rows={3}
              value={formData.declaredServices}
              onChange={e => setFormData({ ...formData, declaredServices: e.target.value })}
              placeholder="es. Servizio A.S. 2021/2022 come CS (8 mesi) e 2022/2023 come AA (6 mesi)"
            />
          </FormField>
        </div>
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
