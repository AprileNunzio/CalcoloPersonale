import { useState } from 'react';
import { History, Plus, Trash2, ArrowUpRight, Check } from 'lucide-react';
import { ScoreValidationDecreeItem } from '../../shared/scoring';
import './decreeHistory.css';

interface DecreeHistorySectionProps {
  history: ScoreValidationDecreeItem[];
  onChange: (items: ScoreValidationDecreeItem[]) => void;
  onApplyAsBase?: (decree: ScoreValidationDecreeItem) => void;
  activeCutoffDate?: string;
}

export function DecreeHistorySection({
  history,
  onChange,
  onApplyAsBase,
  activeCutoffDate,
}: DecreeHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [triennium, setTriennium] = useState('Triennio 2021-2023 (D.M. 50/2021)');
  const [score, setScore] = useState<number | ''>('');
  const [school, setSchool] = useState('');
  const [protocol, setProtocol] = useState('');
  const [date, setDate] = useState('2021-08-31');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (typeof score !== 'number' || score <= 0) return;
    const newItem: ScoreValidationDecreeItem = {
      id: `dec-${Date.now()}`,
      schoolYearOrTriennium: triennium.trim() || 'Triennio Precedente',
      validatedScore: score,
      validatingSchool: school.trim(),
      decreeProtocol: protocol.trim(),
      decreeDate: date || new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
    };
    onChange([...history, newItem]);
    setScore('');
    setSchool('');
    setProtocol('');
    setNotes('');
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(history.filter(h => h.id !== id));
  };

  return (
    <div className="decree-history-container">
      <div className="decree-history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#334155' }}>
          <History size={15} color="#116b62" />
          <span>Storico Decreti e Convalide Pregresse ({history.length})</span>
        </div>
        <button
          type="button"
          className="decree-add-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Plus size={13} />
          <span>{isOpen ? 'Chiudi' : 'Aggiungi Decreto Pregresso'}</span>
        </button>
      </div>

      {history.length > 0 && (
        <div className="decree-history-list">
          {history.map(item => {
            const isCurrentlyBase = activeCutoffDate === item.decreeDate;
            return (
              <div key={item.id} className={`decree-history-item ${isCurrentlyBase ? 'is-active-base' : ''}`}>
                <div className="decree-item-main">
                  <div className="decree-item-top">
                    <span className="decree-item-triennium">{item.schoolYearOrTriennium}</span>
                    <span className="decree-item-score">{item.validatedScore.toFixed(2)} pt</span>
                  </div>
                  <div className="decree-item-details">
                    <span>{item.validatingSchool || 'Scuola non specificata'}</span>
                    {item.decreeProtocol && <span> • Prot. {item.decreeProtocol}</span>}
                    {item.decreeDate && <span> • Data: {item.decreeDate}</span>}
                  </div>
                  {item.notes && <div className="decree-item-notes">{item.notes}</div>}
                </div>

                <div className="decree-item-actions">
                  {onApplyAsBase && (
                    <button
                      type="button"
                      className={`decree-apply-btn ${isCurrentlyBase ? 'applied' : ''}`}
                      onClick={() => onApplyAsBase(item)}
                      title="Imposta questo decreto come base di partenza consolidata"
                    >
                      {isCurrentlyBase ? (
                        <>
                          <Check size={12} />
                          <span>Base Attiva</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={12} />
                          <span>Usa come Base</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    className="decree-delete-btn"
                    onClick={() => handleRemove(item.id)}
                    title="Elimina dallo storico"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div className="decree-history-form">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            Registra Decreto Precedente (es. Convalida del 2021 o 2017)
          </div>
          <div className="decree-form-grid">
            <div>
              <label>Triennio / Anno Scolastico</label>
              <input
                type="text"
                value={triennium}
                onChange={e => setTriennium(e.target.value)}
                placeholder="es. Triennio 2021-2023"
              />
            </div>
            <div>
              <label>Punteggio Convalidato</label>
              <input
                type="number"
                step="0.01"
                value={score}
                onChange={e => setScore(parseFloat(e.target.value) || '')}
                placeholder="es. 15.20"
              />
            </div>
            <div>
              <label>Scuola Convalidante</label>
              <input
                type="text"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="es. I.C. De Amicis"
              />
            </div>
            <div>
              <label>Protocollo Decreto</label>
              <input
                type="text"
                value={protocol}
                onChange={e => setProtocol(e.target.value)}
                placeholder="es. Prot. 142/2021"
              />
            </div>
            <div>
              <label>Data Consolidamento (fino al)</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <label>Note aggiuntive</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="es. Rettificato titolo di accesso"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="decree-btn"
              onClick={() => setIsOpen(false)}
            >
              Annulla
            </button>
            <button
              type="button"
              className="val-btn-save"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={handleAdd}
              disabled={typeof score !== 'number' || score <= 0}
            >
              Aggiungi allo Storico
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
