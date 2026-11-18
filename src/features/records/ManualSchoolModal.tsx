import { useState } from 'react';
import { School, X, Check, AlertCircle } from 'lucide-react';
import { DirectoryEntry } from '../directory/DirectoryPicker';
import './recordEditForm.css';

interface ManualSchoolModalProps {
  initialSchool?: DirectoryEntry | null;
  initialCode?: string;
  onSave: (school: DirectoryEntry) => void;
  onClose: () => void;
}

export function ManualSchoolModal({
  initialSchool,
  initialCode = '',
  onSave,
  onClose,
}: ManualSchoolModalProps) {
  const [code, setCode] = useState(initialSchool?.code || initialCode || '');
  const [name, setName] = useState(initialSchool?.name || '');
  const [municipality, setMunicipality] = useState(initialSchool?.municipality || '');
  const [province, setProvince] = useState(initialSchool?.province || (initialCode.length >= 2 ? initialCode.slice(0, 2).toUpperCase() : ''));
  const [isParitaria, setIsParitaria] = useState(initialSchool?.category === 'SCUANAGRAFEPA');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim() || `Scuola Statale (Cod. ${cleanCode})`;
    const entry: DirectoryEntry = {
      code: cleanCode,
      name: cleanName,
      municipality: municipality.trim(),
      province: province.trim().toUpperCase() || (cleanCode.length >= 2 ? cleanCode.slice(0, 2) : ''),
      region: initialSchool?.region || '',
      address: initialSchool?.address || '',
      postalCode: initialSchool?.postalCode || '',
      email: initialSchool?.email || '',
      pec: initialSchool?.pec || '',
      website: initialSchool?.website || '',
      schoolYear: 'Storico / Personalizzato',
      category: isParitaria ? 'SCUANAGRAFEPA' : 'SCUANAGRAFE',
    };
    onSave(entry);
  };

  return (
    <div className="manual-school-backdrop" onClick={onClose}>
      <div className="manual-school-dialog" onClick={e => e.stopPropagation()}>
        <div className="manual-school-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="manual-school-icon-box">
              <School size={20} color="#116b62" />
            </div>
            <div>
              <h3>Inserimento Scuola Storica o Personalizzata</h3>
              <p>Per codici meccanografici antecedenti o scuole soppresse/accorpate (es. FIMM290003)</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="manual-school-form">
          <div className="manual-school-tip">
            <AlertCircle size={16} color="#0d9488" style={{ flexShrink: 0 }} />
            <span>
              I codici storici utilizzati negli anni passati (es. 2008 o antecedenti) sono pienamente validi per il computo dell'anzianità di servizio e delle graduatorie ATA.
            </span>
          </div>

          <div className="manual-school-grid">
            <div className="field-group">
              <label>Codice Meccanografico (es. FIMM290003)</label>
              <input
                required
                maxLength={12}
                value={code}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setCode(val);
                  if (!province && val.length >= 2) {
                    setProvince(val.slice(0, 2));
                  }
                }}
                placeholder="es. FIMM290003"
                style={{ fontFamily: 'monospace', fontWeight: 650, letterSpacing: '0.5px' }}
              />
            </div>

            <div className="field-group">
              <label>Sigla Provincia</label>
              <input
                maxLength={4}
                value={province}
                onChange={e => setProvince(e.target.value.toUpperCase())}
                placeholder="es. FI"
                style={{ width: '100px', textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Denominazione Istituzione Scolastica</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. Scuola Media Statale 'G. Pascoli' (ex FIMM290003)"
            />
          </div>

          <div className="field-group">
            <label>Comune della Scuola</label>
            <input
              value={municipality}
              onChange={e => setMunicipality(e.target.value)}
              placeholder="es. Firenze"
            />
          </div>

          <div className="checkbox-row" style={{ marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
              <input
                type="checkbox"
                checked={isParitaria}
                onChange={e => setIsParitaria(e.target.checked)}
              />
              <span>Si tratta di Scuola Paritaria o Legalmente Riconosciuta (punteggio 50%)</span>
            </label>
          </div>

          <div className="manual-school-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="primary">
              <Check size={16} /> Conferma e Usa Scuola
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
