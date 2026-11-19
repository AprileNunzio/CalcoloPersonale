import { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Entry, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FormField, FieldStatus } from '../../shared/FormField';
import { ATA_PROFILES } from '../../shared/personUtils';
import { ProfileBadge3d } from '../../shared/icons3d';
import { ApplicationData, TRIENNIUMS } from './types';
import { DirectoryPicker, DirectoryEntry } from '../directory/DirectoryPicker';
import { extractAccessQualification } from '../../shared/scoring/accessScoring';
import { ApplicationListPickers } from './ApplicationListPickers';

export function ApplicationForm({
  person,
  entry,
  onSave,
  onCancel,
  busy,
}: {
  person: Person;
  entry?: Entry;
  onSave: (record: Entry, closeOnSave?: boolean) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const t = useT();

  const qualifications = useMemo(
    () => (person.records || []).filter(r => r.kind === 'qualification' || r.kind === 'title'),
    [person.records]
  );
  const services = useMemo(
    () => (person.records || []).filter(r => r.kind === 'service'),
    [person.records]
  );

  const formatAccessString = (qual?: Entry | null) => {
    if (!qual) return '';
    const pointsStr = qual.amount ? ` - Punteggio/Voto: ${qual.amount} pt` : '';
    const dateStr = qual.start ? ` (${qual.start})` : '';
    return `${qual.title}${pointsStr}${dateStr}`;
  };

  const formatCulturalString = (selectedIds: string[]) => {
    return qualifications
      .filter(q => selectedIds.includes(q.id))
      .map(q => `${q.title}${q.amount ? ` (${q.amount} pt)` : ''}`)
      .join('; ');
  };

  const formatServicesString = (selectedIds: string[]) => {
    return services
      .filter(s => selectedIds.includes(s.id))
      .map(s => {
        const prof = s.profile ? ` [${s.profile}]` : '';
        const dates = s.start ? ` (${s.start}${s.end ? ` → ${s.end}` : ''})` : '';
        const school = s.school ? ` c/o ${s.school.name}` : '';
        return `${s.title}${prof}${dates}${school}`;
      })
      .join('\n');
  };

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

  // Pre-link from records if empty
  if (!initialData.accessQualificationId && qualifications.length > 0) {
    const detected = extractAccessQualification(person.records || [], initialData.profiles[0]) || qualifications[0];
    if (detected) {
      initialData.accessQualificationId = detected.id;
      if (!initialData.declaredAccess) {
        initialData.declaredAccess = formatAccessString(detected);
      }
    }
  }

  if (!initialData.culturalTitleIds && qualifications.length > 0) {
    const cultIds = qualifications
      .filter(q => q.id !== initialData.accessQualificationId)
      .map(q => q.id);
    initialData.culturalTitleIds = cultIds;
    if (!initialData.declaredCultural && cultIds.length > 0) {
      initialData.declaredCultural = formatCulturalString(cultIds);
    }
  }

  if (!initialData.serviceIds && services.length > 0) {
    const sIds = services.map(s => s.id);
    initialData.serviceIds = sIds;
    if (!initialData.declaredServices && sIds.length > 0) {
      initialData.declaredServices = formatServicesString(sIds);
    }
  }

  const [formData, setFormData] = useState<ApplicationData>(initialData);

  const getFieldStatus = (field: keyof ApplicationData): FieldStatus => {
    if (field === 'triennium' || field === 'applicationType') return 'saved';
    if (field === 'submissionDate') {
      return formData.submissionDate ? 'saved' : 'error';
    }
    if (field === 'province') {
      const p = formData.province?.trim() || '';
      if (!p) return 'idle';
      return p.length >= 2 && p.length <= 4 ? 'saved' : 'error';
    }
    if (field === 'protocol') {
      return formData.protocol?.trim() ? 'saved' : 'idle';
    }
    return 'idle';
  };

  const handleFieldBlur = () => {
    if (formData.submissionDate && formData.profiles.length > 0) {
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
      onSave(updatedRecord, false);
    }
  };

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
    const autoAccessQual = extractAccessQualification(person.records || [], formData.profiles[0]) || qualifications[0];
    const autoAccessId = autoAccessQual?.id;
    const autoCulturalIds = qualifications.filter(q => q.id !== autoAccessId).map(q => q.id);
    const autoServiceIds = services.map(s => s.id);

    setFormData(prev => ({
      ...prev,
      accessQualificationId: autoAccessId,
      declaredAccess: formatAccessString(autoAccessQual),
      culturalTitleIds: autoCulturalIds,
      declaredCultural: formatCulturalString(autoCulturalIds),
      serviceIds: autoServiceIds,
      declaredServices: formatServicesString(autoServiceIds),
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
    onSave(updatedRecord, true);
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
        <FormField label={t('triennium')} tip={t('tipTriennium')} status={getFieldStatus('triennium')}>
          <select
            value={formData.triennium}
            onChange={e => {
              const updated = { ...formData, triennium: e.target.value };
              setFormData(updated);
            }}
            onBlur={handleFieldBlur}
          >
            {TRIENNIUMS.map(tri => (
              <option key={tri} value={tri}>
                {tri}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('applicationType')} status={getFieldStatus('applicationType')}>
          <select
            value={formData.applicationType}
            onChange={e => {
              const updated = {
                ...formData,
                applicationType: e.target.value as 'insert' | 'update',
              };
              setFormData(updated);
            }}
            onBlur={handleFieldBlur}
          >
            <option value="insert">{t('newInclusion')}</option>
            <option value="update">{t('updateConfirmation')}</option>
          </select>
        </FormField>

        <div className="wide-field profiles-selector-field">
          <label className="field-label-text">
            {t('profilesChosen')}: <strong>{formData.profiles.join(', ')}</strong> ({formData.profiles.length} selezionat{formData.profiles.length === 1 ? 'o' : 'i'})
          </label>
          <div className="profile-chips-group">
            {ATA_PROFILES.map(prof => {
              const selected = formData.profiles.includes(prof.code);
              return (
                <button
                  type="button"
                  key={prof.code}
                  className={`profile-chip-btn ${selected ? 'active' : ''}`}
                  onClick={() => toggleProfile(prof.code)}
                  aria-pressed={selected}
                  title={`Clicca per ${selected ? 'rimuovere' : 'aggiungere'} il profilo ${prof.code}`}
                >
                  <ProfileBadge3d code={prof.code} size={28} />
                  <span>{prof.code}</span>
                  <small>{prof.label.split('(')[0].trim()}</small>
                  {selected && <span className="profile-chip-check">✓</span>}
                </button>
              );
            })}
          </div>
          <p className="field-tip" style={{ marginTop: 6, fontSize: 11, color: 'var(--on-surface-variant)' }}>
            💡 Clicca su ciascun profilo ATA per includerlo o escluderlo dalla domanda (puoi selezionare più profili contemporaneamente, es. CS + AA + AT).
          </p>
        </div>

        <FormField
          label={t('submissionDate')}
          status={getFieldStatus('submissionDate')}
          errorMessage="La data di presentazione è obbligatoria"
        >
          <input
            type="date"
            value={formData.submissionDate}
            onChange={e => setFormData({ ...formData, submissionDate: e.target.value })}
            onBlur={handleFieldBlur}
          />
        </FormField>

        <FormField label={t('protocolNumber')} tip={t('tipProtocol')} status={getFieldStatus('protocol')}>
          <input
            type="text"
            value={formData.protocol}
            onChange={e => setFormData({ ...formData, protocol: e.target.value })}
            onBlur={handleFieldBlur}
            placeholder="es. MIIC8XXXXX-2024-00123"
          />
        </FormField>

        <FormField
          label={t('province')}
          status={getFieldStatus('province')}
          errorMessage="Inserisci una sigla provincia valida (es. RM, MI, NA)"
        >
          <input
            type="text"
            maxLength={10}
            value={formData.province}
            onChange={e => setFormData({ ...formData, province: e.target.value.toUpperCase() })}
            onBlur={handleFieldBlur}
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

        <ApplicationListPickers
          formData={formData}
          setFormData={setFormData}
          qualifications={qualifications}
          services={services}
          formatAccessString={formatAccessString}
          formatCulturalString={formatCulturalString}
          formatServicesString={formatServicesString}
        />
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
