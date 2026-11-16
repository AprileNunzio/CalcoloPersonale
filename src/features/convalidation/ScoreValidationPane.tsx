import { useState, useContext } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  FileSignature,
  Save,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Person, Archive, Entry } from '../../shared/types';
import { AutoSaveContext } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { call, getRevision } from '../../shared/api';
import {
  calculateProfileScores,
  MinisterialDecree,
  ProfileScore,
  ScoreValidationData,
  extractScoreValidations,
} from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import './scoreValidation.css';

export function ScoreValidationPane({
  person,
  busy,
}: {
  person: Person;
  busy?: boolean;
}) {
  const context = useContext(AutoSaveContext);
  const [decree, setDecree] = useState<MinisterialDecree>('DM_89_2024');
  const [openBreakdown, setOpenBreakdown] = useState<Record<string, boolean>>({});
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  const validationsMap = extractScoreValidations(person);
  const profileScores: ProfileScore[] = calculateProfileScores(person, false, decree);

  const [formState, setFormState] = useState<Record<string, Partial<ScoreValidationData>>>(() => {
    const initial: Record<string, Partial<ScoreValidationData>> = {};
    for (const p of profileScores) {
      const existing = validationsMap[p.code];
      initial[p.code] = {
        profileCode: p.code,
        isConvalidated: existing?.isConvalidated ?? false,
        validatedScore: existing?.validatedScore ?? p.totalScore,
        useValidatedScore: existing?.useValidatedScore ?? false,
        decreeProtocol: existing?.decreeProtocol ?? '',
        decreeDate: existing?.decreeDate ?? '',
        validatingSchool: existing?.validatingSchool ?? '',
        notes: existing?.notes ?? '',
      };
    }
    return initial;
  });

  const handleFieldChange = (
    profileCode: string,
    field: keyof ScoreValidationData,
    value: string | number | boolean
  ) => {
    setFormState(prev => ({
      ...prev,
      [profileCode]: {
        ...prev[profileCode],
        [field]: value,
      },
    }));
  };

  const handleSaveValidation = async (profileCode: string) => {
    setSavingCode(profileCode);
    setFeedback('');

    try {
      await flush();
      const current = formState[profileCode] || {};
      const updatedValidation: ScoreValidationData = {
        profileCode,
        isConvalidated: Boolean(current.isConvalidated),
        validatedScore: typeof current.validatedScore === 'number' ? current.validatedScore : 0,
        useValidatedScore: Boolean(current.useValidatedScore && current.isConvalidated),
        decreeProtocol: current.decreeProtocol?.trim() || '',
        decreeDate: current.decreeDate || '',
        validatingSchool: current.validatingSchool?.trim() || '',
        notes: current.notes?.trim() || '',
        lastUpdated: new Date().toISOString(),
      };

      // Merge into validation entry
      const existingValRecord = (person.records || []).find(
        r => r.kind === 'validation' || (r.kind === 'application' && r.notes?.includes('validations'))
      );

      let validationsObj: Record<string, ScoreValidationData> = { ...validationsMap };
      validationsObj[profileCode] = updatedValidation;

      const recordId = existingValRecord ? existingValRecord.id : `validation-${profileCode.toLowerCase()}`;
      const entry: Entry = {
        id: recordId,
        kind: 'validation',
        title: `Convalida Ufficiale Punteggio ATA (${profileCode})`,
        start: updatedValidation.decreeDate || new Date().toISOString().slice(0, 10),
        end: null,
        amount: updatedValidation.validatedScore,
        profile: profileCode,
        notes: JSON.stringify({
          validations: validationsObj,
          lastUpdated: new Date().toISOString(),
        }),
      };

      const updatedArchive = await call<Archive>('save_record', {
        personId: person.id,
        entryId: entry.id,
        entry,
        revision: getRevision(),
      });

      if (context) {
        context.saved(updatedArchive);
      }

      setFeedback(`Convalida per ${profileCode} salvata con successo!`);
      setTimeout(() => setFeedback(''), 4000);
    } catch {
      setFeedback('Errore durante il salvataggio della convalida.');
    } finally {
      setSavingCode(null);
    }
  };

  return (
    <div className="score-validation-container">
      {/* Header with Decree selection */}
      <div className="validation-header-pane">
        <h2>Convalida Punteggi & Calcolo Normativo ATA</h2>
        <p>
          In conformità con l’art. 6 comma 11 del D.M. 89/2024 e D.M. 50/2021, la scuola di primo servizio verifica e convalida i titoli e servizi dichiarati emettendo apposito Decreto Dirigenziale di Convalida/Rettifica. Seleziona il triennio di riferimento e attiva il flag <strong>"Attieniti al punteggio convalidato"</strong> per congelare e utilizzare ufficialmente il punteggio certificato dalla scuola.
        </p>

        <div className="decree-selector-strip">
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            Normativa Applicata:
          </span>
          <button
            type="button"
            className={`decree-btn ${decree === 'DM_89_2024' ? 'active' : ''}`}
            onClick={() => setDecree('DM_89_2024')}
          >
            D.M. 89/2024 (Triennio 2024-2027 • Vigente)
          </button>
          <button
            type="button"
            className={`decree-btn ${decree === 'DM_50_2021' ? 'active' : ''}`}
            onClick={() => setDecree('DM_50_2021')}
          >
            D.M. 50/2021 (Triennio 2021-2023)
          </button>
          <button
            type="button"
            className={`decree-btn ${decree === 'DM_640_2017' ? 'active' : ''}`}
            onClick={() => setDecree('DM_640_2017')}
          >
            D.M. 640/2017 (Triennio 2017-2020)
          </button>
        </div>

        <div className="decree-callout">
          <Info size={15} />
          {decree === 'DM_89_2024' ? (
            <span>
              <strong>D.M. 89/2024:</strong> Certificazione CIAD obbligatoria per tutti (deroga 1 anno per CS), introduzione del profilo Operatore Scolastico (OS), tetto massimo di 6.00 punti per ciascun anno scolastico (1 sett - 31 ago).
            </span>
          ) : decree === 'DM_50_2021' ? (
            <span>
              <strong>D.M. 50/2021:</strong> Certificazione informatica valutabile come titolo culturale aggiuntivo (0.60 pt AA/AT, 0.30 pt CS), tetto annuale 6.00 pt, profilo OS non previsto nel triennio.
            </span>
          ) : (
            <span>
              <strong>D.M. 640/2017:</strong> Tabella di valutazione previgente con attestati informatici e tetto annuale di servizio.
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{ padding: '10px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, color: '#047857', fontWeight: 600, fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Profile Validation Cards */}
      <div className="profile-validations-grid">
        {profileScores.map(prof => {
          const form = formState[prof.code] || {};
          const isBreakdownOpen = openBreakdown[prof.code] ?? false;

          return (
            <div
              key={prof.code}
              className={`profile-val-card ${prof.useValidatedScore ? 'validated-active' : ''}`}
            >
              <div className="val-card-top">
                <div className="val-card-identity">
                  <ProfileBadge3d code={prof.code} size={36} />
                  <div>
                    <h3>{prof.label} ({prof.code})</h3>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {prof.serviceDays} giorni di servizio complessivi registrati
                    </div>
                  </div>
                </div>

                <div className="val-card-scores-row">
                  {prof.useValidatedScore ? (
                    <div className="val-score-badge official" title="Punteggio Ufficiale Convalidato da Decreto Scuola">
                      <ShieldCheck size={16} />
                      <span>{prof.effectiveScore.toFixed(2)} pt Ufficiale</span>
                    </div>
                  ) : (
                    <div className="val-score-badge calculated" title="Punteggio Teorico Calcolato dal Software">
                      <Award size={16} />
                      <span>{prof.totalScore.toFixed(2)} pt Calcolato</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {prof.useValidatedScore ? (
                <div className="val-convalidation-seal">
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Punteggio Convalidato con Decreto Ufficiale:</strong> {prof.effectiveScore.toFixed(2)} pt
                    {prof.validationDecree ? ` • ${prof.validationDecree}` : ''}
                    {prof.validatingSchool ? ` • Scuola: ${prof.validatingSchool}` : ''}
                    {prof.validationDate ? ` (${prof.validationDate})` : ''}
                  </span>
                </div>
              ) : (
                <div className="val-convalidation-pending">
                  <AlertTriangle size={15} />
                  <span>
                    <strong>Punteggio teorico non ancora convalidato da decreto:</strong> Il punteggio attivo nel sistema ({prof.totalScore.toFixed(2)} pt) è stimato in base alle tue dichiarazioni. Inserisci i dati del decreto di convalida non appena emesso dalla scuola.
                  </span>
                </div>
              )}

              {/* Details & Annual Breakdown Toggle */}
              <div>
                <button
                  type="button"
                  className="decree-btn"
                  onClick={() => setOpenBreakdown(prev => ({ ...prev, [prof.code]: !isBreakdownOpen }))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Dettaglio Calcolo per Anno Scolastico (Tetto 6 pt)</span>
                  {isBreakdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isBreakdownOpen && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
                      • Titolo d’Accesso in decimi: <strong>{prof.baseAccessScore.toFixed(2)} pt</strong>
                      <br />
                      • Titoli Culturali e Certificazioni: <strong>{prof.culturalScore.toFixed(2)} pt</strong>
                      <br />
                      • Servizio Specifico Netto: <strong>{prof.specificServiceScore.toFixed(2)} pt</strong>
                      <br />
                      • Altro Servizio/Docente Netto: <strong>{prof.otherServiceScore.toFixed(2)} pt</strong>
                    </div>

                    {prof.schoolYearBreakdown.length > 0 ? (
                      <div className="val-sy-table-wrap">
                        <table className="val-sy-table">
                          <thead>
                            <tr>
                              <th>Anno Scolastico</th>
                              <th>Giorni</th>
                              <th>Mesi Utili</th>
                              <th>Punti Specifici</th>
                              <th>Altri Punti</th>
                              <th>Punti Anno</th>
                              <th>Stato Tetto Max 6 pt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prof.schoolYearBreakdown.map(sy => (
                              <tr key={sy.schoolYear}>
                                <td><strong>{sy.schoolYear}</strong></td>
                                <td>{sy.days} gg</td>
                                <td>{sy.months} mesi</td>
                                <td>{sy.specificScore.toFixed(2)}</td>
                                <td>{sy.otherScore.toFixed(2)}</td>
                                <td><strong>{sy.cappedScore.toFixed(2)} pt</strong></td>
                                <td>
                                  {sy.isCapped ? (
                                    <span className="capped-tag">Applicato tetto 6.00 pt (lordi: {sy.totalAnnualScore.toFixed(2)})</span>
                                  ) : (
                                    <span style={{ color: '#059669', fontWeight: 600 }}>Entro il limite</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
                        Nessun servizio scolastico registrato per questo profilo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Convalidation Form */}
              <div className="val-form-box">
                <div className="val-form-title">
                  <FileSignature size={16} />
                  <span>Registra Decreto di Convalida Scuola (Art. 6 D.M. 89/2024)</span>
                </div>

                <label className="val-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isConvalidated)}
                    onChange={e => handleFieldChange(prof.code, 'isConvalidated', e.target.checked)}
                  />
                  <span>Punteggio convalidato ufficialmente con Decreto Dirigenziale</span>
                </label>

                {form.isConvalidated && (
                  <>
                    <div className="val-form-fields-grid">
                      <div className="val-field-group">
                        <label>Punteggio Convalidato Ufficiale</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.validatedScore ?? ''}
                          onChange={e => handleFieldChange(prof.code, 'validatedScore', parseFloat(e.target.value) || 0)}
                          placeholder="es. 16.50"
                        />
                      </div>

                      <div className="val-field-group">
                        <label>Scuola Convalidante</label>
                        <input
                          type="text"
                          value={form.validatingSchool ?? ''}
                          onChange={e => handleFieldChange(prof.code, 'validatingSchool', e.target.value)}
                          placeholder="es. I.C. Alessandro Manzoni (RMIC8XX00X)"
                        />
                      </div>

                      <div className="val-field-group">
                        <label>Estremi Decreto / Protocollo</label>
                        <input
                          type="text"
                          value={form.decreeProtocol ?? ''}
                          onChange={e => handleFieldChange(prof.code, 'decreeProtocol', e.target.value)}
                          placeholder="es. Decreto Prot. n. 4521/2024"
                        />
                      </div>

                      <div className="val-field-group">
                        <label>Data Emissione Decreto</label>
                        <input
                          type="date"
                          value={form.decreeDate ?? ''}
                          onChange={e => handleFieldChange(prof.code, 'decreeDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <label className="val-checkbox-row highlight">
                      <input
                        type="checkbox"
                        checked={Boolean(form.useValidatedScore)}
                        onChange={e => handleFieldChange(prof.code, 'useValidatedScore', e.target.checked)}
                      />
                      <span>
                        <strong>Attieniti a questo punteggio convalidato:</strong> Congela e adotta ufficialmente questo punteggio in tutte le graduatorie, dashboard e schede sindacati.
                      </span>
                    </label>

                    <div className="val-field-group">
                      <label>Note o Motivazioni della Rettifica (facoltativo)</label>
                      <textarea
                        rows={2}
                        value={form.notes ?? ''}
                        onChange={e => handleFieldChange(prof.code, 'notes', e.target.value)}
                        placeholder="es. Riconosciuti tutti i servizi statali, rettificato titolo di studio a 8.50 decimi..."
                      />
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="val-btn-save"
                  disabled={busy || savingCode === prof.code}
                  onClick={() => handleSaveValidation(prof.code)}
                >
                  <Save size={14} />
                  <span>{savingCode === prof.code ? 'Salvataggio...' : 'Salva Convalida Ufficiale'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
