import { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Briefcase,
  Users2,
} from 'lucide-react';
import { Person, Entry, Archive } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { flush } from '../autosave/store';
import { extractTextFromPdf } from '../../shared/pdfExtractor';
import {
  parseIstanzeOnlineText,
  ParsedIstanzeOnlineData,
} from './istanzeOnlineParser';

export interface IstanzeOnlineImportModalProps {
  currentPerson: Person;
  onImportComplete: (updatedPerson: Person, updatedArchive: Archive) => void;
  onClose: () => void;
  busy?: boolean;
}

export function IstanzeOnlineImportModal({
  currentPerson,
  onImportComplete,
  onClose,
  busy,
}: IstanzeOnlineImportModalProps) {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [parsedData, setParsedData] = useState<ParsedIstanzeOnlineData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setErrorMsg('');
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const extracted = await extractTextFromPdf(buffer);
        setInputText(extracted);
        executeParse(extracted);
        return;
      }
      const content = await file.text();
      setInputText(content);
      executeParse(content);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossibile leggere il file selezionato.');
    } finally {
      setIsParsing(false);
    }
  };

  const executeParse = (textToParse: string) => {
    if (!textToParse.trim()) {
      setErrorMsg('Incolla o carica il testo della domanda scaricata da Istanze Online (POLIS).');
      return;
    }

    setIsParsing(true);
    setErrorMsg('');

    try {
      const data = parseIstanzeOnlineText(textToParse);
      setParsedData(data);
    } catch {
      setErrorMsg('Errore durante la lettura del testo della domanda.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyImport = async () => {
    if (!parsedData) return;
    setIsSaving(true);
    setErrorMsg('');

    try {
      await flush();

      const newRecords: Entry[] = [...(currentPerson.records || [])];

      if (parsedData.accessTitle) {
        newRecords.push({
          id: crypto.randomUUID(),
          kind: 'qualification',
          title: parsedData.accessTitle.title,
          start: parsedData.accessTitle.date || new Date().toISOString().slice(0, 10),
          end: null,
          amount: parsedData.accessTitle.points,
          notes: JSON.stringify({
            isAccessTitle: true,
            scoreAchieved: parsedData.accessTitle.score,
            scoreBase: parsedData.accessTitle.base,
            calculatedPoints: parsedData.accessTitle.points,
          }),
          profile: parsedData.profiles[0] || 'CS',
          school: null,
        });
      }

      for (const ct of parsedData.culturalTitles) {
        newRecords.push({
          id: crypto.randomUUID(),
          kind: 'qualification',
          title: ct.title,
          start: new Date().toISOString().slice(0, 10),
          end: null,
          amount: ct.points,
          notes: JSON.stringify({ kind: ct.kind, calculatedPoints: ct.points }),
          profile: parsedData.profiles[0] || 'CS',
          school: null,
        });
      }

      for (const s of parsedData.services) {
        newRecords.push({
          id: crypto.randomUUID(),
          kind: 'service',
          title: `${s.school} (${s.isStatale ? 'Statale' : 'Paritaria'})`,
          start: s.start,
          end: s.end,
          amount: null,
          notes: JSON.stringify({ sector: s.isStatale ? 'statale_ata' : 'paritaria_ata' }),
          profile: s.profile,
          school: null,
        });
      }

      const updatedPerson: Person = {
        ...currentPerson,
        fiscalCode: parsedData.fiscalCode || currentPerson.fiscalCode,
        profile: parsedData.profiles[0] || currentPerson.profile || 'CS',
        records: newRecords,
      };

      const updatedArchive = await call<Archive>('save_person', {
        person: updatedPerson,
        revision: getRevision(),
      });

      onImportComplete(updatedPerson, updatedArchive);
    } catch (e) {
      setErrorMsg(typeof e === 'string' ? e : 'Errore durante l\'importazione dei dati nel fascicolo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true">
      <div className="wizard-container" style={{ maxWidth: 840 }}>
        <div className="wizard-header">
          <div className="wizard-top-bar">
            <span className="wizard-brand-badge">
              <Sparkles size={14} />
              Importazione Automatica Domanda Istanze Online (POLIS)
            </span>
            <button className="wizard-close-btn" onClick={onClose} disabled={isSaving}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="wizard-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {errorMsg && (
            <div role="alert" className="wizard-info-callout warning" style={{ marginBottom: 16 }}>
              <AlertCircle size={18} />
              <div>
                <strong>Attenzione:</strong> {errorMsg}
              </div>
            </div>
          )}

          {!parsedData ? (
            <div>
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) void handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--outline-variant)',
                  background: isDragging ? 'var(--primary-container)' : 'var(--surface-container-high)',
                  padding: '24px 16px',
                  borderRadius: 12,
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                <Upload size={32} color={isDragging ? 'var(--primary)' : 'var(--on-surface-variant)'} style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)' }}>
                  Trascina qui il file PDF della Domanda Istanze Online (Zero-Click)
                </div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                  oppure clicca qui per selezionare il file dal tuo computer
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.txt"
                  onChange={e => {
                    if (e.target.files?.[0]) void handleFile(e.target.files[0]);
                  }}
                  style={{ display: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6 }}>
                  Oppure incolla direttamente il testo estratto dalla domanda:
                </label>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Incolla qui il testo della ricevuta della domanda ATA III Fascia scaricata da Istanze Online..."
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid var(--outline-variant)', borderRadius: 8, fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  className="primary"
                  onClick={() => executeParse(inputText)}
                  disabled={isParsing || !inputText.trim()}
                  style={{ marginTop: 10 }}
                >
                  {isParsing ? 'Analisi in corso...' : 'Analizza ed Estrai Dati'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--secondary-container)', border: '1px solid var(--outline-variant)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary)', fontWeight: 700, fontSize: 14 }}>
                  <CheckCircle2 size={18} color="var(--secondary)" />
                  Domanda Analizzata con Successo! Verifica i dati estratti:
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--secondary)' }}>
                  Profili: <strong>{parsedData.profiles.join(', ')}</strong> {parsedData.fiscalCode && `· Codice Fiscale: ${parsedData.fiscalCode}`}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {parsedData.accessTitle && (
                  <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                      <GraduationCap size={16} color="var(--primary)" /> Titolo di Accesso Rilevato
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                      {parsedData.accessTitle.title} &rarr; <strong>{parsedData.accessTitle.points.toFixed(2)} punti</strong> (voto {parsedData.accessTitle.score}/{parsedData.accessTitle.base})
                    </div>
                  </div>
                )}

                {parsedData.culturalTitles.length > 0 && (
                  <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                      <FileText size={16} color="var(--secondary)" /> Titoli Culturali & Informatici ({parsedData.culturalTitles.length})
                    </div>
                    <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {parsedData.culturalTitles.map((ct, idx) => (
                        <li key={idx}>
                          {ct.title} (+{ct.points.toFixed(2)} pt)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedData.services.length > 0 && (
                  <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                      <Briefcase size={16} color="var(--tertiary)" /> Periodi di Servizio Rilevati ({parsedData.services.length})
                    </div>
                    <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {parsedData.services.map((s, idx) => (
                        <li key={idx}>
                          {s.start} &rarr; {s.end} ({s.profile}) - {s.isStatale ? 'Scuola Statale' : 'Scuola Paritaria'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(parsedData.hasSpouse || (parsedData.childrenCount && parsedData.childrenCount > 0)) && (
                  <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                      <Users2 size={16} color="var(--primary)" /> Preferenze e Famiglia
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                      {parsedData.hasSpouse && '• Coniuge a carico / ricongiungimento indicato'}
                      {parsedData.childrenCount && ` • Figli a carico: ${parsedData.childrenCount}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--outline-variant)' }}>
          {parsedData ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setParsedData(null)}
              disabled={isSaving}
            >
              Ricarica / Modifica Testo
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose} disabled={isSaving}>
              Annulla
            </button>
            {parsedData && (
              <button
                type="button"
                className="primary"
                onClick={handleApplyImport}
                disabled={isSaving || busy}
              >
                {isSaving ? 'Importazione in corso...' : 'Conferma e Importa nel Fascicolo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
