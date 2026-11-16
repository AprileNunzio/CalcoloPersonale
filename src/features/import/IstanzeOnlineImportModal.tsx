import { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  User,
  GraduationCap,
  Briefcase,
  Users2,
} from 'lucide-react';
import { Person, Entry, Archive } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { flush } from '../autosave/store';

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
  const [parsedData, setParsedData] = useState<{
    fiscalCode?: string;
    lastName?: string;
    firstName?: string;
    profiles: string[];
    accessTitle?: { title: string; score: number; base: number; points: number; date?: string };
    culturalTitles: { title: string; points: number; kind: string }[];
    services: { school: string; profile: string; start: string; end: string; isStatale: boolean }[];
    hasSpouse?: boolean;
    childrenCount?: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleParse = () => {
    if (!inputText.trim()) {
      setErrorMsg('Incolla il testo della domanda scaricata da Istanze Online (POLIS).');
      return;
    }

    setIsParsing(true);
    setErrorMsg('');

    try {
      const text = inputText;

      // Extract Fiscal Code
      const cfMatch = text.match(/[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]/i);
      const fiscalCode = cfMatch ? cfMatch[0].toUpperCase() : undefined;

      // Extract Profiles
      const profiles: string[] = [];
      if (/collaboratore scolastico|\bcs\b/i.test(text)) profiles.push('CS');
      if (/assistente amministrativo|\baa\b/i.test(text)) profiles.push('AA');
      if (/assistente tecnico|\bat\b/i.test(text)) profiles.push('AT');
      if (/operatore scolastico|\bos\b/i.test(text)) profiles.push('OS');
      if (/cuoco|\bcu\b/i.test(text)) profiles.push('CU');
      if (/guardarobiere|\bgu\b/i.test(text)) profiles.push('GU');
      if (/addetto aziende agrarie|\bcr\b/i.test(text)) profiles.push('CR');

      // Extract Access Title and Score
      let accessTitle: { title: string; score: number; base: number; points: number; date?: string } | undefined;
      const scoreMatch = text.match(/(?:votazione|voto|punti|punteggio)[^\d]*(\d{1,3})\s*(?:\/|\s+su\s+)\s*(\d{2,3})/i) ||
        text.match(/(\d{1,3})\s*\/\s*(\d{2,3})/);

      if (scoreMatch) {
        const score = parseFloat(scoreMatch[1]);
        const base = parseFloat(scoreMatch[2]);
        if (score > 0 && base > 0 && score <= base) {
          const points = Number(((score / base) * 10).toFixed(2));
          accessTitle = {
            title: `Diploma di Scuola Secondaria (${score}/${base})`,
            score,
            base,
            points,
          };
        }
      }

      // Cultural Titles
      const culturalTitles: { title: string; points: number; kind: string }[] = [];
      if (/alfabetizzazione|ciad/i.test(text)) {
        culturalTitles.push({
          title: 'Certificazione Internazionale di Alfabetizzazione Digitale (CIAD)',
          points: 0,
          kind: 'ciad',
        });
      }
      if (/dattilografia/i.test(text)) {
        culturalTitles.push({
          title: 'Corso di Addestramento alla Dattilografia',
          points: 1.0,
          kind: 'typing',
        });
      }
      if (/eipass|icdl|ecdl|digcomp|pekit/i.test(text)) {
        culturalTitles.push({
          title: 'Certificazione Informatica (EIPASS / ICDL / DigComp)',
          points: profiles.includes('CS') && profiles.length === 1 ? 0.30 : 0.60,
          kind: 'digital',
        });
      }
      if (/laurea/i.test(text)) {
        culturalTitles.push({
          title: 'Diploma di Laurea',
          points: 2.0,
          kind: 'degree',
        });
      }

      // Service Periods (Matches dates in DD/MM/YYYY or YYYY-MM-DD format)
      const services: { school: string; profile: string; start: string; end: string; isStatale: boolean }[] = [];
      const dateRangeRegex = /(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\s*(?:al|a|-|–)\s*(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/gi;
      let match: RegExpExecArray | null;
      let counter = 1;

      while ((match = dateRangeRegex.exec(text)) !== null) {
        const rawStart = match[1];
        const rawEnd = match[2];

        // Format to YYYY-MM-DD
        const toIso = (dStr: string) => {
          const parts = dStr.split(/[\/\-.]/);
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          return dStr;
        };

        const startIso = toIso(rawStart);
        const endIso = toIso(rawEnd);

        services.push({
          school: `Servizio Scolastico ${counter}`,
          profile: profiles[0] || 'CS',
          start: startIso,
          end: endIso,
          isStatale: !text.toLowerCase().includes('paritaria'),
        });
        counter++;
      }

      // Family & Preferences
      const hasSpouse = /coniuge|marito|moglie/i.test(text);
      let childrenCount = 0;
      const childMatch = text.match(/(\d+)\s*figli/i);
      if (childMatch) {
        childrenCount = parseInt(childMatch[1], 10);
      } else if (/figli/i.test(text)) {
        childrenCount = 1;
      }

      setParsedData({
        fiscalCode,
        profiles: profiles.length > 0 ? profiles : ['CS'],
        accessTitle,
        culturalTitles,
        services,
        hasSpouse,
        childrenCount,
      });
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

      // 1. Add Access Title
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

      // 2. Add Cultural Titles
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

      // 3. Add Services
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
              <div className="wizard-info-callout" style={{ marginBottom: 16 }}>
                <FileText size={20} color="#2563eb" />
                <div>
                  <h4>Come importare la domanda Istanze Online</h4>
                  <p>
                    Apri il file PDF della domanda presentata su Istanze Online (POLIS) per le graduatorie ATA di III fascia (D.M. 89/2024 o precedenti), seleziona tutto il testo (<code>Ctrl+A</code>), copialo (<code>Ctrl+C</code>) e incollalo nel riquadro sottostante.
                  </p>
                </div>
              </div>

              <textarea
                rows={10}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Incolla qui il testo della domanda scaricata da Istanze Online (POLIS)..."
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: 12 }}
              />

              <div style={{ marginTop: 14, textAlign: 'right' }}>
                <button
                  type="button"
                  className="wizard-btn-next"
                  onClick={handleParse}
                  disabled={isParsing || !inputText.trim()}
                >
                  <Sparkles size={16} /> Analizza Domanda
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckCircle2 size={24} color="#059669" />
                <div>
                  <h4 style={{ margin: 0, color: '#065f46' }}>Domanda analizzata con successo!</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#047857' }}>
                    Verifica i dati estratti prima di confermare l'importazione nel fascicolo personale.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={16} /> Dati Generali & Profili
                  </h5>
                  <div style={{ fontSize: 12 }}>
                    <div>Codice Fiscale: <strong>{parsedData.fiscalCode || currentPerson.fiscalCode || 'Non rilevato'}</strong></div>
                    <div>Profili Richiesti: <strong>{parsedData.profiles.join(', ')}</strong></div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GraduationCap size={16} /> Titolo di Accesso
                  </h5>
                  <div style={{ fontSize: 12 }}>
                    {parsedData.accessTitle ? (
                      <>
                        <div>{parsedData.accessTitle.title}</div>
                        <div>Punteggio calcolato: <strong style={{ color: '#059669' }}>{parsedData.accessTitle.points.toFixed(2)} pt</strong></div>
                      </>
                    ) : (
                      <span className="muted">Nessun titolo di accesso con voto identificato nel testo.</span>
                    )}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} /> Titoli Culturali ({parsedData.culturalTitles.length})
                  </h5>
                  <div style={{ fontSize: 12 }}>
                    {parsedData.culturalTitles.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {parsedData.culturalTitles.map((ct, idx) => (
                          <li key={idx}>{ct.title} (+{ct.points.toFixed(2)} pt)</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="muted">Nessuna certificazione aggiuntiva rilevata.</span>
                    )}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Briefcase size={16} /> Periodi di Servizio ({parsedData.services.length})
                  </h5>
                  <div style={{ fontSize: 12 }}>
                    {parsedData.services.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {parsedData.services.map((s, idx) => (
                          <li key={idx}>{s.school} ({s.start} - {s.end})</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="muted">Nessun periodo con date precise rilevato.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <div className="wizard-footer-left">
            {parsedData && (
              <button
                type="button"
                className="wizard-btn-prev"
                onClick={() => setParsedData(null)}
                disabled={isSaving}
              >
                Modifica Testo
              </button>
            )}
          </div>

          <div>
            {parsedData && (
              <button
                type="button"
                className="wizard-btn-finish"
                onClick={handleApplyImport}
                disabled={isSaving || busy}
              >
                <CheckCircle2 size={18} />
                {isSaving ? 'Importazione in corso...' : 'Conferma e Importa nel Fascicolo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
