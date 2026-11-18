import { useState, useContext } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  FileSignature,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Calculator,
  CalendarClock,
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
  ScoreValidationDecreeItem,
  extractScoreValidations,
} from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import { SchoolYearBreakdownTable } from './SchoolYearBreakdownTable';
import { DecreeHistorySection } from './DecreeHistorySection';
import { ValidationHeader } from './ValidationHeader';
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
        isIncrementalBase: existing?.isIncrementalBase ?? false,
        consolidationDate: existing?.consolidationDate ?? '2021-08-31',
        decreeHistory: existing?.decreeHistory ?? [],
        notes: existing?.notes ?? '',
      };
    }
    return initial;
  });

  const handleFieldChange = (
    profileCode: string,
    field: keyof ScoreValidationData,
    value: unknown
  ) => {
    setFormState(prev => ({
      ...prev,
      [profileCode]: {
        ...prev[profileCode],
        [field]: value,
      },
    }));
  };

  const handleApplyDecreeAsBase = (profileCode: string, dec: ScoreValidationDecreeItem) => {
    setFormState(prev => ({
      ...prev,
      [profileCode]: {
        ...prev[profileCode],
        isConvalidated: true,
        useValidatedScore: true,
        isIncrementalBase: true,
        validatedScore: dec.validatedScore,
        consolidationDate: dec.decreeDate || '2021-08-31',
        validatingSchool: dec.validatingSchool || prev[profileCode]?.validatingSchool,
        decreeProtocol: dec.decreeProtocol || prev[profileCode]?.decreeProtocol,
        decreeDate: dec.decreeDate || prev[profileCode]?.decreeDate,
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
        isIncrementalBase: Boolean(current.isIncrementalBase),
        consolidationDate: current.consolidationDate || '2021-08-31',
        decreeHistory: current.decreeHistory || [],
        notes: current.notes?.trim() || '',
        lastUpdated: new Date().toISOString(),
      };

      const existingValRecord = (person.records || []).find(
        r => r.kind === 'validation' || (r.kind === 'application' && r.notes?.includes('validations'))
      );

      const validationsObj: Record<string, ScoreValidationData> = { ...validationsMap };
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
      <ValidationHeader decree={decree} onDecreeChange={setDecree} />

      {feedback && (
        <div style={{ padding: '10px 16px', background: 'var(--secondary-container)', border: '1px solid var(--outline-variant)', borderRadius: 10, color: 'var(--secondary)', fontWeight: 600, fontSize: 13 }}>
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
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {prof.isIncrementalBase ? (
                        <span>
                          Base convalidata + {prof.subsequentDays ?? 0} gg maturati successivamente
                        </span>
                      ) : (
                        <span>{prof.serviceDays} giorni di servizio complessivi registrati</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="val-card-scores-row">
                  {prof.useValidatedScore ? (
                    <div className="val-score-badge official" title="Punteggio Ufficiale Convalidato">
                      <ShieldCheck size={16} />
                      <span>{prof.effectiveScore.toFixed(2)} pt {prof.isIncrementalBase ? 'Aggiornato' : 'Ufficiale'}</span>
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
                prof.isIncrementalBase ? (
                  <div className="val-incremental-banner">
                    <div className="val-incremental-title">
                      <Calculator size={16} />
                      <span>Calcolo Incrementale Attivo (Base Consolidata + Servizi Nuovi)</span>
                    </div>
                    <div className="val-math-breakdown">
                      <div className="val-math-pill base">
                        <span className="pill-label">Base al {prof.consolidationDate || 'data'}</span>
                        <span className="pill-value">{(prof.baseConsolidatedScore ?? 0).toFixed(2)} pt</span>
                      </div>
                      <span className="math-operator">+</span>
                      <div className="val-math-pill added">
                        <span className="pill-label">Nuovi Servizi ({prof.subsequentDays ?? 0} gg)</span>
                        <span className="pill-value">+{(prof.subsequentScore ?? 0).toFixed(2)} pt</span>
                      </div>
                      <span className="math-operator">=</span>
                      <div className="val-math-pill total">
                        <span className="pill-label">Punteggio Aggiornato</span>
                        <span className="pill-value">{prof.effectiveScore.toFixed(2)} pt</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="val-convalidation-seal">
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>Punteggio Convalidato Fisso:</strong> {prof.effectiveScore.toFixed(2)} pt
                      {prof.validationDecree ? ` • ${prof.validationDecree}` : ''}
                      {prof.validatingSchool ? ` • Scuola: ${prof.validatingSchool}` : ''}
                      {prof.validationDate ? ` (${prof.validationDate})` : ''}
                    </span>
                  </div>
                )
              ) : (
                <div className="val-convalidation-pending">
                  <AlertTriangle size={15} />
                  <span>
                    <strong>Punteggio teorico non convalidato:</strong> Il punteggio attivo ({prof.totalScore.toFixed(2)} pt) è stimato. Se hai una convalida di anni precedenti o recente, registrala sotto per congelarla.
                  </span>
                </div>
              )}

              {/* Annual Breakdown Toggle */}
              <div>
                <button
                  type="button"
                  className="decree-btn"
                  onClick={() => setOpenBreakdown(prev => ({ ...prev, [prof.code]: !isBreakdownOpen }))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>
                    {prof.isIncrementalBase ? 'Dettaglio Nuovi Servizi Maturati' : 'Dettaglio Calcolo per Anno Scolastico (Tetto 6 pt)'}
                  </span>
                  {isBreakdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isBreakdownOpen && (
                  <SchoolYearBreakdownTable
                    breakdowns={prof.schoolYearBreakdown}
                    baseAccessScore={prof.baseAccessScore}
                    culturalScore={prof.culturalScore}
                    specificServiceScore={prof.specificServiceScore}
                    otherServiceScore={prof.otherServiceScore}
                    isIncremental={prof.isIncrementalBase}
                  />
                )}
              </div>

              {/* Historical Decrees List */}
              <DecreeHistorySection
                history={form.decreeHistory || []}
                activeCutoffDate={form.isIncrementalBase ? form.consolidationDate : undefined}
                onChange={items => handleFieldChange(prof.code, 'decreeHistory', items)}
                onApplyAsBase={dec => handleApplyDecreeAsBase(prof.code, dec)}
              />

              {/* Convalidation Form */}
              <div className="val-form-box">
                <div className="val-form-title">
                  <FileSignature size={16} />
                  <span>Configurazione Decreto Ufficiale (Art. 6 D.M. 89/2024)</span>
                </div>

                <label className="val-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isConvalidated)}
                    onChange={e => handleFieldChange(prof.code, 'isConvalidated', e.target.checked)}
                  />
                  <span>Attiva convalida ufficiale per questo profilo</span>
                </label>

                {form.isConvalidated && (
                  <>
                    {/* Mode Selector */}
                    <div className="val-mode-selector">
                      <div
                        className={`val-mode-card ${!form.isIncrementalBase ? 'active' : ''}`}
                        onClick={() => handleFieldChange(prof.code, 'isIncrementalBase', false)}
                      >
                        <div className="val-mode-title">
                          <ShieldCheck size={16} color={!form.isIncrementalBase ? 'var(--primary)' : 'var(--on-surface-variant)'} />
                          <span>Punteggio Totale Fisso</span>
                        </div>
                        <p>Il decreto determina l'intero punteggio finale senza ulteriori aggiunte automatiche.</p>
                      </div>

                      <div
                        className={`val-mode-card ${form.isIncrementalBase ? 'active' : ''}`}
                        onClick={() => handleFieldChange(prof.code, 'isIncrementalBase', true)}
                      >
                        <div className="val-mode-title">
                          <Layers size={16} color={form.isIncrementalBase ? 'var(--primary)' : 'var(--on-surface-variant)'} />
                          <span>Base Consolidata + Calcolo Incrementale</span>
                        </div>
                        <p>Il decreto fissa la base fino alla data indicata; il software calcola in automatico solo i contratti e i titoli maturati dopo.</p>
                      </div>
                    </div>

                    <div className="val-form-fields-grid">
                      <div className="val-field-group">
                        <label>{form.isIncrementalBase ? 'Punteggio Base Convalidato' : 'Punteggio Convalidato Ufficiale'}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.validatedScore ?? ''}
                          onChange={e => handleFieldChange(prof.code, 'validatedScore', parseFloat(e.target.value) || 0)}
                          placeholder="es. 15.50"
                        />
                      </div>

                      {form.isIncrementalBase && (
                        <div className="val-field-group highlight-border">
                          <label style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                            <CalendarClock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Data di Consolidamento (fino al)
                          </label>
                          <input
                            type="date"
                            value={form.consolidationDate || '2021-08-31'}
                            onChange={e => handleFieldChange(prof.code, 'consolidationDate', e.target.value)}
                          />
                        </div>
                      )}

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
                        <strong>Attieniti a questa convalida:</strong> Adotta questo punteggio {form.isIncrementalBase ? '(Base + Servizi Nuovi)' : 'ufficiale'} in graduatorie, dashboard e schede sindacato.
                      </span>
                    </label>

                    <div className="val-field-group">
                      <label>Note o Motivazioni della Rettifica (facoltativo)</label>
                      <textarea
                        rows={2}
                        value={form.notes ?? ''}
                        onChange={e => handleFieldChange(prof.code, 'notes', e.target.value)}
                        placeholder="es. Riconosciuti tutti i servizi statali, consolidata graduatoria triennio precedente..."
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
