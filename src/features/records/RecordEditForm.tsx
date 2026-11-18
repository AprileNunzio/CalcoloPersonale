import React from 'react';
import { Entry, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { AutoSaveStatus } from '../autosave/AutoSave';
import { FormField, FieldStatus } from '../../shared/FormField';
import { DirectoryPicker } from '../directory/DirectoryPicker';
import { ATA_PROFILES } from '../../shared/personUtils';
import { AbsenceInfoCard } from './AbsenceInfoCard';
import { ServiceDetailFields } from './ServiceDetailFields';
import { ServiceSector, ServiceContractType } from './serviceCalculations';
import { FamilyMemberPicker } from './FamilyMemberPicker';
import { detectContractType } from '../../shared/entitlements';
import { QualificationPresetSelector } from './QualificationPresetSelector';
import { getTitleLabel, getTitlePlaceholder, getStartLabel } from './recordFormLabels';

export interface RecordEditFormProps {
  draft: Entry;
  setDraft: (entry: Entry | null) => void;
  person: Person;
  section: string;
  kinds: string[];
  pending: boolean;
  busy: boolean;
  otherPeople: Person[];
  familySource: 'manual' | 'archive';
  setFamilySource: (s: 'manual' | 'archive') => void;
  selectedLinkedId: string;
  onPickArchivePerson: (chosen: Person | null) => void;
  onSubmit: (entry: Entry) => void;
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

export function RecordEditForm({
  draft,
  setDraft,
  person,
  section,
  kinds,
  pending,
  busy,
  otherPeople,
  familySource,
  setFamilySource,
  selectedLinkedId,
  onPickArchivePerson,
  onSubmit,
}: RecordEditFormProps) {
  const t = useT();
  const parsedDraftNotes = parseNotes(draft.notes);

  const getFieldStatus = (field: 'title' | 'start' | 'end' | 'notes' | 'profile'): FieldStatus => {
    if (field === 'title') return draft.title.trim().length > 0 ? 'saved' : 'error';
    if (field === 'start') return draft.start ? 'saved' : 'error';
    if (field === 'end') {
      if (!draft.end) return 'idle';
      return draft.end >= draft.start ? 'saved' : 'error';
    }
    return 'idle';
  };

  const handleSectorChange = (sector: ServiceSector) => {
    const updated = { ...parsedDraftNotes, sector };
    setDraft({ ...draft, notes: JSON.stringify(updated) });
  };

  const handleWeeklyHoursChange = (weeklyHours: number) => {
    const updated = { ...parsedDraftNotes, weeklyHours };
    setDraft({ ...draft, notes: JSON.stringify(updated) });
  };

  const handleContractTypeChange = (contractType: ServiceContractType) => {
    const updated = { ...parsedDraftNotes, contractType };
    setDraft({ ...draft, notes: JSON.stringify(updated) });
  };

  const handleNotesTextChange = (text: string) => {
    if (draft.kind === 'service' || draft.kind === 'child') {
      const updated = { ...parsedDraftNotes, text };
      setDraft({ ...draft, notes: JSON.stringify(updated) });
    } else {
      setDraft({ ...draft, notes: text });
    }
  };

  const currentSector: ServiceSector = parsedDraftNotes.sector || 'statale_ata';
  const currentWeeklyHours: number =
    typeof parsedDraftNotes.weeklyHours === 'number'
      ? parsedDraftNotes.weeklyHours
      : draft.profile === 'DOCENTE'
      ? 18
      : 36;
  const currentContractType: ServiceContractType = parsedDraftNotes.contractType || 'term';

  return (
    <form
      className="panel form"
      onSubmit={event => {
        event.preventDefault();
        onSubmit(draft);
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
            onSelect={onPickArchivePerson}
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
                value={draft.school?.name || ''}
                onSelect={school => {
                  const isParitaria = school.category === 'SCUANAGRAFEPA';
                  const autoSector: ServiceSector = isParitaria ? 'paritaria_ata' : 'statale_ata';
                  const updatedNotes = {
                    ...parsedDraftNotes,
                    sector: autoSector,
                    schoolCode: school.code,
                    schoolMunicipality: school.municipality,
                    schoolProvince: school.province,
                  };
                  setDraft({
                    ...draft,
                    school,
                    title: school.name,
                    notes: JSON.stringify(updatedNotes),
                  });
                }}
              />
            </FormField>
          </div>
        )}

        {draft.school && (
          <div className="school-summary" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>
                  {draft.school.code} · {draft.school.name}
                </strong>
                <p>
                  {draft.school.address} · {draft.school.postalCode} · {draft.school.municipality} ({draft.school.province})
                </p>
                <p>
                  {draft.school.email} · {draft.school.pec}
                </p>
              </div>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: 12, padding: '4px 8px' }}
                onClick={() => setDraft({ ...draft, school: undefined })}
              >
                {t('change')}
              </button>
            </div>
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
                weeklyHours={currentWeeklyHours}
                contractType={currentContractType}
                notes={draft.notes}
                onChangeSector={handleSectorChange}
                onChangeWeeklyHours={handleWeeklyHoursChange}
                onChangeContractType={handleContractTypeChange}
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
  );
}
