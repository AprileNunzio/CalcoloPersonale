import { Edit3, X } from 'lucide-react';
import { DirectoryEntry } from '../directory/DirectoryPicker';

interface SelectedSchoolCardProps {
  school: DirectoryEntry;
  onEdit: () => void;
  onRemove: () => void;
}

export function SelectedSchoolCard({ school, onEdit, onRemove }: SelectedSchoolCardProps) {
  const isParitaria = school.category === 'SCUANAGRAFEPA';
  const isHistorical = school.category === 'SCUOLASTORICA';
  return (
    <div className="selected-school-card-modern" style={{ marginBottom: 16 }}>
      <div className="school-card-main-col">
        <div className="school-card-title-row">
          <span className="school-code-chip">{school.code || 'COD. NON SPECIFICATO'}</span>
          <span className={`school-source-chip ${isHistorical ? 'historical' : ''}`}>
            {isParitaria
              ? 'Paritaria (50%)'
              : isHistorical
              ? 'Storica / Deprecata (es. 2008)'
              : 'Statale (Pieno ✓)'}
          </span>
        </div>
        <div className="school-card-name">{school.name}</div>
        <div className="school-card-location">
          {school.municipality} {school.province && `(${school.province})`}
          {school.address && ` · ${school.address}`}
        </div>
      </div>
      <div className="school-card-actions">
        <button
          type="button"
          className="card-action-btn"
          title="Modifica dati scuola"
          onClick={onEdit}
        >
          <Edit3 size={14} />
        </button>
        <button
          type="button"
          className="card-action-btn delete"
          title="Rimuovi o cambia scuola"
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
