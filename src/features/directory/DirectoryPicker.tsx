import { useEffect, useId, useRef, useState } from 'react';
import { Search, X, School, MapPin, Plus } from 'lucide-react';
import { call } from '../../shared/api';
import { useT } from '../../shared/i18n';
import './styles.css';

export interface DirectoryEntry {
  code: string;
  name: string;
  municipality: string;
  province: string;
  region: string;
  address: string;
  postalCode: string;
  email: string;
  pec: string;
  website: string;
  schoolYear: string;
  category: string;
  details?: Record<string, string>;
}

export interface DirectoryPickerProps {
  kind: 'school' | 'municipality';
  onSelect: (entry: DirectoryEntry) => void;
  onOpenManual?: () => void;
  value?: string;
  placeholder?: string;
  autoClearOnSelect?: boolean;
  className?: string;
}

export function DirectoryPicker({
  kind,
  onSelect,
  onOpenManual,
  value = '',
  placeholder,
  autoClearOnSelect = false,
  className = '',
}: DirectoryPickerProps) {
  const t = useT();
  const id = useId();
  const [query, setQuery] = useState(value);
  const [rows, setRows] = useState<DirectoryEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined && value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]);

  useEffect(() => {
    let live = true;
    const trimmed = query.trim();
    if (trimmed.length < 2 || !isOpen) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      call<DirectoryEntry[]>('search_directory', { kind, query: trimmed })
        .then(results => {
          if (live) {
            setRows(results || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (live) {
            setRows([]);
            setLoading(false);
          }
        });
    }, 120);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, kind, isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const choose = (entry: DirectoryEntry) => {
    onSelect(entry);
    if (autoClearOnSelect) {
      setQuery('');
    } else {
      setQuery(entry.name);
    }
    setRows([]);
    setIsOpen(false);
    setActive(-1);
  };

  const defaultPlaceholder =
    placeholder ||
    (kind === 'school'
      ? 'Digita nome scuola, comune, provincia o codice meccanografico...'
      : 'Digita comune, sigla provincia o codice catastale...');

  return (
    <div className={`directory-picker-wrapper ${className}`} ref={containerRef}>
      <div className="directory-picker-input-box">
        {kind === 'school' ? (
          <School size={16} className="directory-icon" />
        ) : (
          <MapPin size={16} className="directory-icon" />
        )}
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && rows.length > 0}
          aria-controls={`${id}-list`}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={defaultPlaceholder}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive(i => Math.min(i + 1, rows.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && active >= 0 && rows[active]) {
              e.preventDefault();
              choose(rows[active]);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="directory-clear-btn"
            onClick={() => {
              setQuery('');
              setRows([]);
              setIsOpen(false);
            }}
            aria-label="Cancella testo"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && rows.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="directory-dropdown-menu">
          {rows.map((r, i) => {
            const isStatale = r.category !== 'SCUANAGRAFEPA';
            const cadastral = r.details?.['Codice Catastale del Comune'];
            return (
              <li
                key={`${r.code}-${i}`}
                id={`${id}-${i}`}
                role="option"
                aria-selected={active === i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => choose(r)}
                className={`directory-menu-item ${active === i ? 'selected' : ''}`}
              >
                <div className="directory-item-header">
                  <strong className="directory-item-name">{r.name}</strong>
                  {kind === 'school' ? (
                    <span className={`cat-pill ${isStatale ? 'statale' : 'paritaria'}`}>
                      {isStatale ? 'Statale' : 'Paritaria'}
                    </span>
                  ) : (
                    <span className="cat-pill prov">({r.province})</span>
                  )}
                </div>
                <div className="directory-item-sub">
                  <span className="code-badge">{r.code}</span>
                  {r.municipality && <span>{r.municipality}</span>}
                  {r.province && <span>({r.province})</span>}
                  {cadastral && <span className="catastale-tag">Catasto: {cadastral}</span>}
                  {r.address && <small className="addr-tag">{r.address}</small>}
                </div>
              </li>
            );
          })}
          {kind === 'school' && (
            <li
              className="directory-menu-item historical-custom-option"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                const q = query.trim().toUpperCase();
                const isCode = /^[A-Z0-9]{6,12}$/i.test(q);
                const prov = isCode && q.length >= 2 ? q.slice(0, 2) : '';
                choose({
                  code: isCode ? q : '',
                  name: isCode ? `Scuola Statale (Codice ${q})` : query.trim(),
                  municipality: '',
                  province: prov,
                  region: '',
                  address: '',
                  postalCode: '',
                  email: '',
                  pec: '',
                  website: '',
                  schoolYear: 'Storico / Pregresso',
                  category: 'SCUOLASTORICA',
                });
              }}
            >
              <div className="directory-item-header">
                <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Usa "{query.trim()}" come codice / scuola storica o deprecata
                </span>
                <span className="cat-pill" style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }}>
                  Storico
                </span>
              </div>
              <div className="directory-item-sub" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                Per servizi ante 2024 (es. FIMM290003 nel 2008) o istituti accorpati/soppressi.
              </div>
            </li>
          )}
        </ul>
      )}

      {isOpen && !loading && query.trim().length >= 2 && rows.length === 0 && (
        <div className="directory-dropdown-empty">
          <p style={{ margin: '0 0 10px 0', fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Nessun istituto trovato nell'anagrafe attiva con "<strong>{query.trim()}</strong>"
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="use-historical-school-btn"
              onClick={() => {
                const q = query.trim().toUpperCase();
                const isCode = /^[A-Z0-9]{6,12}$/i.test(q);
                const prov = isCode && q.length >= 2 ? q.slice(0, 2) : '';
                choose({
                  code: isCode ? q : '',
                  name: isCode ? `Scuola Statale (Codice ${q})` : query.trim(),
                  municipality: '',
                  province: prov,
                  region: '',
                  address: '',
                  postalCode: '',
                  email: '',
                  pec: '',
                  website: '',
                  schoolYear: 'Storico / Pregresso',
                  category: 'SCUOLASTORICA',
                });
              }}
            >
              <Plus size={13} />
              <span>Usa "{query.trim()}" come codice storico</span>
            </button>
            {onOpenManual && (
              <button
                type="button"
                className="use-historical-school-btn secondary"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManual();
                }}
              >
                Compila dati scuola manualmente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
