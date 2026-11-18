import React from 'react';
import { Entry } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FormField } from '../../shared/FormField';
import { DirectoryPicker } from '../directory/DirectoryPicker';
import { ServiceSector } from './serviceCalculations';
import { SelectedSchoolCard } from './SelectedSchoolCard';

interface ServiceSchoolSelectorProps {
  draft: Entry;
  setDraft: (entry: Entry) => void;
  parsedDraftNotes: Record<string, any>;
  onOpenManualModal: () => void;
}

export function ServiceSchoolSelector({
  draft,
  setDraft,
  parsedDraftNotes,
  onOpenManualModal,
}: ServiceSchoolSelectorProps) {
  const t = useT();

  if (draft.school) {
    return (
      <SelectedSchoolCard
        school={draft.school}
        onEdit={onOpenManualModal}
        onRemove={() => setDraft({ ...draft, school: undefined })}
      />
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <FormField label={t('schoolSearch')} tip={t('tipServiceSchool')} className="wide">
        <DirectoryPicker
          kind="school"
          value=""
          onOpenManual={onOpenManualModal}
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
              title: draft.title.trim() ? draft.title : school.name,
              notes: JSON.stringify(updatedNotes),
            });
          }}
        />
      </FormField>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="link-style-btn"
          style={{
            fontSize: 12,
            color: '#0d9488',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 600,
          }}
          onClick={onOpenManualModal}
        >
          + Non trovi la scuola? Inserisci scuola storica o codice manuale (es. FIMM290003)
        </button>
      </div>
    </div>
  );
}
