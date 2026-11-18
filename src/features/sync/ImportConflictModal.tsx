import { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
  UserCheck,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import type { Person } from '../../shared/types';
import type { PersonSyncDiff, ResolutionChoice } from './exportImportTypes';
import { applyPersonMerge } from './personDiff';
import './syncModal.css';

interface ImportConflictModalProps {
  diff: PersonSyncDiff;
  importedPerson: Person;
  onClose: () => void;
  onConfirm: (mergedPerson: Person) => void;
}

export function ImportConflictModal({
  diff,
  importedPerson,
  onClose,
  onConfirm,
}: ImportConflictModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'identity' | 'records'>('summary');

  const [identityChoices, setIdentityChoices] = useState<Record<string, 'keep_local' | 'use_imported'>>(() => {
    const initial: Record<string, 'keep_local' | 'use_imported'> = {};
    for (const d of diff.identityDiffs) {
      initial[d.field] = d.choice;
    }
    return initial;
  });

  const [recordChoices, setRecordChoices] = useState<Record<string, ResolutionChoice>>(() => {
    const initial: Record<string, ResolutionChoice> = {};
    for (const r of diff.recordDiffs) {
      initial[r.id] = r.choice;
    }
    return initial;
  });

  const handleIdentityChoice = (field: string, choice: 'keep_local' | 'use_imported') => {
    setIdentityChoices(prev => ({ ...prev, [field]: choice }));
  };

  const handleRecordChoice = (id: string, choice: ResolutionChoice) => {
    setRecordChoices(prev => ({ ...prev, [id]: choice }));
  };

  const handleAcceptAllImported = () => {
    const nextId: Record<string, 'keep_local' | 'use_imported'> = {};
    for (const d of diff.identityDiffs) nextId[d.field] = 'use_imported';
    setIdentityChoices(nextId);

    const nextRec: Record<string, ResolutionChoice> = {};
    for (const r of diff.recordDiffs) nextRec[r.id] = 'use_imported';
    setRecordChoices(nextRec);
  };

  const handleKeepAllLocal = () => {
    const nextId: Record<string, 'keep_local' | 'use_imported'> = {};
    for (const d of diff.identityDiffs) nextId[d.field] = 'keep_local';
    setIdentityChoices(nextId);

    const nextRec: Record<string, ResolutionChoice> = {};
    for (const r of diff.recordDiffs) nextRec[r.id] = 'keep_local';
    setRecordChoices(nextRec);
  };

  const handleFinalConfirm = () => {
    const merged = applyPersonMerge(
      diff.matchTarget || null,
      importedPerson,
      diff,
      identityChoices,
      recordChoices,
    );
    onConfirm(merged);
  };

  const localTarget = diff.matchTarget;
  const personName = `${importedPerson.lastName} ${importedPerson.firstName}`;
  const personCf = importedPerson.fiscalCode || '—';

  return (
    <div className="sync-modal-backdrop" role="dialog" aria-modal="true">
      <div className="sync-modal-window">
        <header className="sync-modal-header">
          <div className="sync-header-left">
            <div className="sync-icon-badge">
              <RefreshCw size={22} />
            </div>
            <div className="sync-header-titles">
              <h3>Sincronizzazione Fascicolo Persona</h3>
              <p>
                {personName} · Codice Fiscale: <strong>{personCf}</strong>
              </p>
            </div>
          </div>
          <button className="sync-close-btn" onClick={onClose} title="Chiudi">
            <X size={18} />
          </button>
        </header>

        <div className="sync-modal-body">
          {diff.isExistingPerson ? (
            <div className="sync-status-banner existing">
              <AlertTriangle size={20} />
              <div>
                <strong>Persona già registrata in archivio locale!</strong>
                <div>
                  È stato trovato un fascicolo corrispondente con{' '}
                  {diff.matchReason === 'fiscal_code' ? 'lo stesso Codice Fiscale' : "lo stesso identificativo ID"}.
                  Verifica di seguito le discrepanze prima di confermare.
                </div>
              </div>
            </div>
          ) : (
            <div className="sync-status-banner new">
              <CheckCircle2 size={20} />
              <div>
                <strong>Nuova persona pronta all'importazione</strong>
                <div>Nessun conflitto rilevato. Verrà creato un nuovo fascicolo con tutti i dati e i servizi allegati.</div>
              </div>
            </div>
          )}

          <div className="sync-summary-grid">
            <div className="sync-stat-card new">
              <PlusCircle size={22} color="var(--secondary)" />
              <div>
                <div className="sync-stat-num">{diff.summary.newRecords}</div>
                <div className="sync-stat-label">Nuovi Record da Importare</div>
              </div>
            </div>
            <div className="sync-stat-card modified">
              <AlertTriangle size={22} color="var(--tertiary)" />
              <div>
                <div className="sync-stat-num">{diff.summary.modifiedRecords}</div>
                <div className="sync-stat-label">Record con Discrepanze</div>
              </div>
            </div>
            <div className="sync-stat-card identical">
              <UserCheck size={22} color="var(--on-surface-variant)" />
              <div>
                <div className="sync-stat-num">{diff.summary.identityChanges}</div>
                <div className="sync-stat-label">Campi Anagrafici Diversi</div>
              </div>
            </div>
            <div className="sync-stat-card identical">
              <FileSpreadsheet size={22} color="var(--on-surface-variant)" />
              <div>
                <div className="sync-stat-num">{diff.summary.identicalRecords}</div>
                <div className="sync-stat-label">Record Già Identici</div>
              </div>
            </div>
          </div>

          <div className="sync-tabs">
            <button
              className={`sync-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Panoramica & Azioni Rapide
            </button>
            {diff.isExistingPerson && diff.identityDiffs.length > 0 && (
              <button
                className={`sync-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
                onClick={() => setActiveTab('identity')}
              >
                Anagrafica ({diff.identityDiffs.length})
              </button>
            )}
            <button
              className={`sync-tab-btn ${activeTab === 'records' ? 'active' : ''}`}
              onClick={() => setActiveTab('records')}
            >
              Record e Servizi ({diff.recordDiffs.length})
            </button>
          </div>

          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--outline-variant)', lineHeight: '1.5' }}>
                {diff.isExistingPerson ? (
                  <>
                    Il file importato contiene dati per <strong>{personName}</strong> che differiscono da quelli
                    presenti su questo dispositivo. Puoi scegliere singolarmente campo per campo se mantenere la
                    versione locale o sovrascrivere con i dati del file, oppure applicare le opzioni rapide sottostanti.
                  </>
                ) : (
                  <>
                    Il fascicolo di <strong>{personName}</strong> verrà aggiunto alla lista del personale con{' '}
                    <strong>{importedPerson.records.length}</strong> registrazioni complessive.
                  </>
                )}
              </div>

              {diff.isExistingPerson && (
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button type="button" className="sync-btn-secondary" onClick={handleAcceptAllImported}>
                    Usa tutti i dati del file importato
                  </button>
                  <button type="button" className="sync-btn-secondary" onClick={handleKeepAllLocal}>
                    Mantieni preferibilmente i dati locali in conflitto
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'identity' && (
            <table className="sync-diff-table">
              <thead>
                <tr>
                  <th>Campo Anagrafico</th>
                  <th>Valore Attuale sul PC</th>
                  <th>Valore nel File Importato</th>
                  <th>Scelta</th>
                </tr>
              </thead>
              <tbody>
                {diff.identityDiffs.map(idDiff => {
                  const currentChoice = identityChoices[idDiff.field] || idDiff.choice;
                  return (
                    <tr key={idDiff.field}>
                      <td>
                        <strong>{idDiff.label}</strong>
                      </td>
                      <td className="diff-val-local">{idDiff.localValue}</td>
                      <td className="diff-val-imported">{idDiff.importedValue}</td>
                      <td>
                        <div className="diff-choice-toggle">
                          <button
                            type="button"
                            className={`diff-choice-btn ${currentChoice === 'keep_local' ? 'selected-local' : ''}`}
                            onClick={() => handleIdentityChoice(idDiff.field, 'keep_local')}
                          >
                            Mantieni Locale
                          </button>
                          <button
                            type="button"
                            className={`diff-choice-btn ${currentChoice === 'use_imported' ? 'selected-import' : ''}`}
                            onClick={() => handleIdentityChoice(idDiff.field, 'use_imported')}
                          >
                            Usa File
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'records' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {diff.recordDiffs.map(rec => {
                const currentChoice = recordChoices[rec.id] || rec.choice;
                return (
                  <div key={rec.id} className={`sync-record-card status-${rec.status}`}>
                    <div className="sync-record-card-top">
                      <div className="sync-record-info">
                        <span className="sync-kind-tag">{rec.kind}</span>
                        <span className="sync-record-title">{rec.title}</span>
                      </div>
                      {rec.status === 'modified' && (
                        <div className="diff-choice-toggle">
                          <button
                            type="button"
                            className={`diff-choice-btn ${currentChoice === 'keep_local' ? 'selected-local' : ''}`}
                            onClick={() => handleRecordChoice(rec.id, 'keep_local')}
                          >
                            Mantieni Locale
                          </button>
                          <button
                            type="button"
                            className={`diff-choice-btn ${currentChoice === 'use_imported' ? 'selected-import' : ''}`}
                            onClick={() => handleRecordChoice(rec.id, 'use_imported')}
                          >
                            Usa File
                          </button>
                          <button
                            type="button"
                            className={`diff-choice-btn ${currentChoice === 'keep_both' ? 'selected-both' : ''}`}
                            onClick={() => handleRecordChoice(rec.id, 'keep_both')}
                          >
                            Conserva Entrambi
                          </button>
                        </div>
                      )}
                      {rec.status === 'new_in_import' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                          Verrà aggiunto (+1)
                        </span>
                      )}
                      {rec.status === 'identical' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Già allineato</span>
                      )}
                    </div>

                    {rec.changes && rec.changes.length > 0 && (
                      <div className="sync-changes-list">
                        {rec.changes.map(ch => (
                          <div key={ch.field} className="sync-change-item">
                            <span className="sync-change-label">{ch.label}:</span>
                            <span className="sync-change-old">{ch.local}</span>
                            <span className="sync-change-arrow">→</span>
                            <span className="sync-change-new">{ch.imported}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="sync-modal-footer">
          <button type="button" className="sync-btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button type="button" className="sync-btn-confirm" onClick={handleFinalConfirm}>
            <CheckCircle2 size={16} />
            <span>Conferma e Sincronizza</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
