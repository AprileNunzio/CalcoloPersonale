import { useRef, useEffect } from 'react';
import type { DirectoryEntry } from '../directory/DirectoryPicker';

interface WizardStepAnagraficaProps {
  lastName: string;
  setLastName: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  birthPlace: string;
  setBirthPlace: (v: string) => void;
  birthProvince: string;
  setBirthProvince: (v: string) => void;
  fiscalCode: string;
  setFiscalCode: (v: string) => void;
  muniQuery: string;
  setMuniQuery: (v: string) => void;
  muniResults: DirectoryEntry[];
  showMuniDropdown: boolean;
  setShowMuniDropdown: (v: boolean) => void;
}

export function WizardStepAnagrafica({
  lastName,
  setLastName,
  firstName,
  setFirstName,
  gender,
  setGender,
  birthDate,
  setBirthDate,
  birthPlace,
  setBirthPlace,
  birthProvince,
  setBirthProvince,
  fiscalCode,
  setFiscalCode,
  muniQuery,
  setMuniQuery,
  muniResults,
  showMuniDropdown,
  setShowMuniDropdown,
}: WizardStepAnagraficaProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMuniDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowMuniDropdown]);

  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 20 }}>
        <h2>Dati Anagrafici e Identità del Candidato</h2>
        <p className="muted">
          Inserisci i tuoi dati anagrafici. Il Codice Fiscale costituisce l'identificativo ministeriale univoco collegato al portale Istanze Online (POLIS).
        </p>
      </div>

      <div className="fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <label>
          Cognome *
          <input
            type="text"
            required
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="es. Rossi"
          />
        </label>

        <label>
          Nome *
          <input
            type="text"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="es. Mario"
          />
        </label>

        <label>
          Genere *
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="female">Femminile</option>
            <option value="male">Maschile</option>
            <option value="other">Altro</option>
          </select>
        </label>

        <label>
          Data di Nascita
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
          />
        </label>

        <div className="birth-place-box" ref={dropdownRef} style={{ position: 'relative' }}>
          <label>
            Comune di Nascita
            <input
              type="text"
              autoComplete="off"
              value={muniQuery}
              onChange={e => {
                setMuniQuery(e.target.value);
                setBirthPlace(e.target.value);
                setShowMuniDropdown(true);
              }}
              onFocus={() => muniQuery.length >= 2 && setShowMuniDropdown(true)}
              placeholder="es. Firenze, Roma, Napoli..."
            />
          </label>
          {showMuniDropdown && muniResults.length > 0 && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#ffffff',
                border: '1.5px solid #116b62',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                listStyle: 'none',
                margin: 0,
                padding: 4,
                zIndex: 100,
                maxHeight: 180,
                overflowY: 'auto',
              }}
            >
              {muniResults.map(res => (
                <li
                  key={res.code}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e6f4f1')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setBirthPlace(res.name);
                    setBirthProvince(res.province);
                    setMuniQuery(res.name);
                    setShowMuniDropdown(false);
                  }}
                >
                  <strong>{res.name}</strong>
                  <span style={{ fontSize: 12, color: '#116b62' }}>({res.province})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label>
          Provincia (Sigla)
          <input
            type="text"
            maxLength={5}
            value={birthProvince}
            onChange={e => setBirthProvince(e.target.value.toUpperCase())}
            placeholder="es. FI, RM, NA, EE"
          />
        </label>

        <label style={{ gridColumn: '1 / -1' }}>
          Codice Fiscale * (16 caratteri)
          <input
            type="text"
            maxLength={16}
            required
            value={fiscalCode}
            onChange={e => setFiscalCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
            placeholder="RSSMRA85M01D612L"
            style={{ letterSpacing: 1.5, fontWeight: 700 }}
          />
        </label>
      </div>
    </div>
  );
}
