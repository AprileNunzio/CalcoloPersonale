import React, { useState, useMemo } from 'react';
import { Briefcase, Award, HeartPulse, X, Check, Edit3, Calendar, AlertOctagon, ArrowLeft } from 'lucide-react';
import { Entry, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { formatDateItalian } from '../../shared/dateUtils';
import { AutoSaveStatus } from '../autosave/AutoSave';
import { FormField, FieldStatus } from '../../shared/FormField';
import { ATA_PROFILES } from '../../shared/personUtils';
import { AbsenceInfoCard } from './AbsenceInfoCard';
import { ServiceDetailFields } from './ServiceDetailFields';
import { ServiceSector, ServiceContractType, detectContractTypeFromDates } from './serviceCalculations';
import { detectContractType } from '../../shared/entitlements';
import { FamilyMemberPicker } from './FamilyMemberPicker';
import { QualificationPresetSelector } from './QualificationPresetSelector';
import { ManualSchoolModal } from './ManualSchoolModal';
import { ServiceSchoolSelector } from './ServiceSchoolSelector';
import { getTitleLabel, getTitlePlaceholder, getStartLabel } from './recordFormLabels';
import { analyzeAranAbsenceSequences } from '../absences/aranRules';
import { analyzeServiceAranRules } from '../services/serviceAranRules';
import { AranInlineAlert } from './AranInlineAlert';
import './recordEditForm.css';

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
  onSubmit: (entry: Entry, closeForm?: boolean) => void;
  onClose?: () => void;
}

function parseNotes(notes: string): {
  text: string;
  sector?: ServiceSector;
  contractType?: ServiceContractType;
  weeklyHours?: number;
  linkedPersonId?: string;
  isRuolo?: boolean;
} {
  try { if (notes.startsWith('{')) return JSON.parse(notes); } catch { return { text: notes }; }
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
  onClose,
}: RecordEditFormProps) {
  const t = useT();
  const [submitted, setSubmitted] = useState(false);
  const [showManualSchoolModal, setShowManualSchoolModal] = useState(false);
  const parsedDraftNotes = parseNotes(draft.notes);
  const confirmedRuolo = person.records?.find(
    r => r.kind === 'service' && (r.notes?.includes('"contractType":"permanent"') || r.notes?.includes('"isRuolo":true'))
  );
  const isArt59Candidate = Boolean(
    confirmedRuolo && draft.profile && confirmedRuolo.profile && draft.profile !== confirmedRuolo.profile
  );
  const isEditing = Boolean(draft.id && person.records.some(r => r.id === draft.id));

  const aranAlerts = useMemo(() => {
    if (section !== 'absences' || !draft.start) return [];
    const simulated = [
      ...person.records.filter(r => r.id !== draft.id),
      { ...draft, id: draft.id || 'simulated-new' },
    ];
    return analyzeAranAbsenceSequences(simulated, { daysPerWeek: 5 });
  }, [section, draft, person.records]);

  const serviceAranAlerts = useMemo(() => {
    if (section !== 'service' || !draft.start) return [];
    return analyzeServiceAranRules(draft, person.records);
  }, [section, draft, person.records]);

  const handleFieldBlur = () => {
    if (draft.title.trim().length > 0 && draft.start) {
      if (!draft.end || draft.end >= draft.start) {
        const finalDraft: Entry = {
          ...draft,
          id: draft.id && draft.id.trim().length > 0 ? draft.id.trim() : crypto.randomUUID(),
        };
        onSubmit(finalDraft, false);
      }
    }
  };

  const getFieldStatus = (field: 'title' | 'start' | 'end' | 'notes' | 'profile' | 'amount'): FieldStatus => {
    if (field === 'title') return draft.title.trim().length > 0 ? 'saved' : submitted ? 'error' : 'idle';
    if (field === 'start') return draft.start ? 'saved' : submitted ? 'error' : 'idle';
    if (field === 'end') return !draft.end ? 'idle' : draft.end >= draft.start ? 'saved' : 'error';
    if (field === 'amount') return typeof draft.amount === 'number' && !isNaN(draft.amount) ? 'saved' : 'idle';
    if (field === 'profile') return draft.profile ? 'saved' : 'idle';
    return 'idle';
  };

  const handleDateChange = (field: 'start' | 'end', val: string | null) => {
    const nextStart = field === 'start' ? (val || '') : draft.start;
    const nextEnd = field === 'end' ? val : draft.end;
    let nextNotes = draft.notes;
    if (draft.kind === 'service' && !parsedDraftNotes.isRuolo && parsedDraftNotes.contractType !== 'permanent') {
      const autoType = detectContractTypeFromDates(nextStart, nextEnd, false);
      nextNotes = JSON.stringify({ ...parsedDraftNotes, contractType: autoType });
    }
    setDraft({ ...draft, [field]: val, notes: nextNotes });
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
    const updated = {
      ...parsedDraftNotes,
      contractType,
      isRuolo: contractType === 'permanent',
    };
    setDraft({ ...draft, notes: JSON.stringify(updated) });
  };

  const handleRuoloDetailsChange = (ruoloData: Record<string, unknown>) => {
    const updated = {
      ...parsedDraftNotes,
      ...ruoloData,
      isRuolo: true,
      contractType: 'permanent' as ServiceContractType,
    };
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
      className="modern-record-form"
      onSubmit={event => {
        event.preventDefault();
        setSubmitted(true);
        if (!draft.title.trim() || !draft.start) {
          return;
        }
        if (draft.end && draft.end < draft.start) {
          return;
        }
        const finalDraft: Entry = {
          ...draft,
          id: draft.id && draft.id.trim().length > 0 ? draft.id.trim() : crypto.randomUUID(),
        };
        onSubmit(finalDraft, true);
      }}
    >
      <fieldset className="application-boundary" disabled={pending || busy}>
        <div className="modern-form-header">
          <div className="modern-form-title-col">
            <div className="modern-form-icon">
              {draft.kind === 'service' ? (
                <Briefcase size={22} color="var(--primary)" />
              ) : draft.kind === 'qualification' ? (
                <Award size={22} color="var(--primary)" />
              ) : (
                <HeartPulse size={22} color="var(--tertiary)" />
              )}
            </div>
            <div>
              <h2>{isEditing ? t('edit') : draft.kind === 'service' ? 'Nuovo Periodo di Servizio' : t('addRecord')}</h2>
              <p className="modern-form-subtitle">
                {draft.kind === 'service'
                  ? 'Compila le date e la scuola per calcolare automaticamente punteggio graduatorie e anzianità'
                  : 'Registra i dettagli conformi alle normative vigenti'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AutoSaveStatus />
            <button
              type="button"
              className="form-close-x-btn"
              title="Chiudi modulo"
              onClick={() => onClose ? onClose() : setDraft(null)}
            >
              <X size={18} />
            </button>
          </div>
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
          <ServiceSchoolSelector
            draft={draft}
            setDraft={setDraft}
            parsedDraftNotes={parsedDraftNotes}
            onOpenManualModal={() => setShowManualSchoolModal(true)}
          />
        )}

        <div className="fields">
          {kinds.length > 1 && (
            <FormField label={t('kind')}>
              <select
                value={draft.kind}
                onChange={event => setDraft({ ...draft, kind: event.target.value })}
              >
                {kinds.map(k => <option key={k} value={k}>{t(k)}</option>)}
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
                {ATA_PROFILES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
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
            errorMessage="La denominazione o titolo è obbligatorio"
          >
            <input
              required
              maxLength={160}
              value={draft.title}
              onChange={event => setDraft({ ...draft, title: event.target.value })}
              onBlur={handleFieldBlur}
              placeholder={getTitlePlaceholder(draft.kind)}
            />
          </FormField>

          {draft.kind === 'qualification' && (
            <FormField
              label="Punteggio Titolo (in decimi)"
              tip="Punteggio ministeriale attribuito al titolo (es. 8.00 per voto 80/100, 1.00 per Dattilografia, 0 per CIAD)."
              status={getFieldStatus('amount')}
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
                onBlur={handleFieldBlur}
                placeholder="es. 8.00"
              />
            </FormField>
          )}

          <FormField
            label={getStartLabel(draft.kind)}
            tip={draft.kind === 'service' ? t('tipServiceStart') : undefined}
            status={getFieldStatus('start')}
            errorMessage={!draft.start && submitted ? "La data di inizio è obbligatoria" : undefined}
          >
            <input
              required
              type="date"
              value={draft.start}
              onChange={event => handleDateChange('start', event.target.value)}
              onBlur={handleFieldBlur}
            />
            {draft.start && (
              <span className="date-italian-preview">
                📅 {formatDateItalian(draft.start)}
              </span>
            )}
          </FormField>

          {draft.kind !== 'child' && (
            <FormField
              label={t('end')}
              tip={draft.kind === 'service' ? t('tipServiceEnd') : undefined}
              status={getFieldStatus('end')}
              errorMessage={draft.end && draft.start && draft.end < draft.start ? "La data di fine non può essere precedente all'inizio" : undefined}
            >
              <input
                type="date"
                min={draft.start}
                value={draft.end ?? ''}
                onChange={event => handleDateChange('end', event.target.value || null)}
                onBlur={handleFieldBlur}
              />
              {draft.end && (
                <span className="date-italian-preview">
                  📅 {formatDateItalian(draft.end)}
                </span>
              )}
            </FormField>
          )}

          {draft.kind === 'service' && (
            <div className="wide" style={{ gridColumn: '1 / -1', marginTop: -6, marginBottom: 4 }}>
              <div className="date-presets-bar">
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 650 }}>Scorciatoie:</span>
                <button
                  type="button"
                  className="date-preset-chip"
                  onClick={() => {
                    const y = draft.start ? draft.start.slice(0, 4) : '2023';
                    setDraft({ ...draft, start: `${y}-09-01`, end: `${parseInt(y, 10) + 1}-08-31` });
                  }}
                >
                  Anno Completo (01/09 - 31/08)
                </button>
                <button
                  type="button"
                  className="date-preset-chip"
                  onClick={() => {
                    const y = draft.start ? draft.start.slice(0, 4) : '2024';
                    setDraft({ ...draft, end: `${y}-06-30` });
                  }}
                >
                  Termine Attività (Fino al 30/06)
                </button>
              </div>
            </div>
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
                isPermanentInOtherProfile={isArt59Candidate}
                ruoloProfile={confirmedRuolo?.profile || undefined}
                onChangeSector={handleSectorChange}
                onChangeWeeklyHours={handleWeeklyHoursChange}
                onChangeContractType={handleContractTypeChange}
                onChangeRuoloDetails={handleRuoloDetailsChange}
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

        <AranInlineAlert alerts={[...aranAlerts, ...serviceAranAlerts]} />

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
            onClick={() => onClose ? onClose() : setDraft(null)}
          >
            {t('closeForm')}
          </button>
          <button type="submit">{t('save')} e Torna</button>
        </div>
      </fieldset>

      {showManualSchoolModal && (
        <ManualSchoolModal
          initialSchool={draft.school}
          initialCode={draft.school?.code || ''}
          onSave={school => {
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
              title: draft.title.trim() ? draft.title : school.name,
              notes: JSON.stringify(updatedNotes),
            });
            setShowManualSchoolModal(false);
          }}
          onClose={() => setShowManualSchoolModal(false)}
        />
      )}
    </form>
  );
}
