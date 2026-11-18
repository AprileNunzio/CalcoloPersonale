import { useState } from 'react';
import {
  Banknote,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { FormField } from '../../shared/FormField';
import {
  NaspiPaymentRecord,
  NaspiEvaluation,
  verifyPaymentCorrectness,
  computeCalibratedNetRatio,
} from './naspiCalculations';

interface NaspiPaymentRegisterProps {
  evaluation: NaspiEvaluation;
  payments: NaspiPaymentRecord[];
  onAddPayment: (p: Omit<NaspiPaymentRecord, 'id'>) => void;
  onRemovePayment: (id: string) => void;
  busy?: boolean;
}

export function NaspiPaymentRegister({
  evaluation,
  payments,
  onAddPayment,
  onRemovePayment,
  busy,
}: NaspiPaymentRegisterProps) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>('');
  const [competenceMonth, setCompetenceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [daysPaid, setDaysPaid] = useState<number>(30);
  const [notes, setNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    onAddPayment({
      paymentDate,
      amount: Number(amount),
      competenceMonth,
      daysPaid: daysPaid > 0 ? daysPaid : 30,
      notes: notes.trim(),
    });
    setAmount('');
    setNotes('');
  };

  const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingProjected = Math.max(0, evaluation.totalProjectedNet - totalReceived);
  const calibratedRatio = computeCalibratedNetRatio(payments, evaluation.baseMonthlyGross);

  return (
    <div className="naspi-card-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <h3 className="naspi-card-title" style={{ margin: 0 }}>
            <Banknote size={19} color="#059669" />
            Registro Bonifici INPS Ricevuti & Verifica di Correttezza
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>
            Inserisci i bonifici effettivamente accreditati dall'INPS per confrontarli con la stima algoritmica e ricalibrare le proiezioni future.
          </p>
        </div>

        {payments.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: '#ecfdf5', padding: '6px 12px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
              <small style={{ fontSize: 10.5, color: '#047857', fontWeight: 700, display: 'block' }}>INCASSATO EFFETTIVO</small>
              <strong style={{ fontSize: 15, color: '#065f46' }}>€ {totalReceived.toFixed(2)}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, display: 'block' }}>RESIDUO STIMATO</small>
              <strong style={{ fontSize: 15, color: '#1e293b' }}>€ {remainingProjected.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Form di inserimento bonifico */}
      <form
        onSubmit={handleAdd}
        style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} color="#059669" />
          <span>Registra Nuovo Accredito Bonifico INPS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <FormField label="Data Accredito Bonifico">
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
            />
          </FormField>

          <FormField label="Importo Netto Accreditato (€)">
            <input
              type="number"
              step="0.01"
              min={1}
              required
              placeholder="es. 1045.50"
              value={amount}
              onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
            />
          </FormField>

          <FormField label="Mese di Competenza">
            <input
              type="month"
              required
              value={competenceMonth}
              onChange={e => setCompetenceMonth(e.target.value)}
            />
          </FormField>

          <FormField label="Giorni Indennizzati">
            <input
              type="number"
              min={1}
              max={31}
              value={daysPaid}
              onChange={e => setDaysPaid(parseInt(e.target.value, 10) || 30)}
            />
          </FormField>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <FormField label="Note opzionali o causale bonifico">
              <input
                type="text"
                placeholder="es. Primo pagamento con conguaglio giorni / Ritenute addizionali regionali..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={busy || !amount}
            style={{
              height: 40,
              background: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} /> Aggiungi Bonifico
          </button>
        </div>
      </form>

      {/* Banner di Auto-calibrazione dell'Algoritmo */}
      {payments.length >= 2 && (
        <div className="calibration-notice-banner" style={{ marginBottom: 16 }}>
          <Sparkles size={18} />
          <div>
            <strong>Algoritmo Auto-Calibrato sui Bonifici Reali:</strong> In base ai {payments.length} bonifici registrati,
            il coefficiente netto effettivo applicato dall'INPS sul tuo profilo è del <strong>{Math.round(calibratedRatio * 100)}%</strong>.
            Le proiezioni dei mesi futuri sono state ricalibrate per la massima aderenza fiscale.
          </div>
        </div>
      )}

      {/* Tabella / Lista dei Bonifici con Diagnosi di Correttezza */}
      {payments.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: 13 }}>
          Nessun bonifico ancora registrato. Appena ricevi il primo accredito dall'INPS, inseriscilo qui per testarne la correttezza rispetto alla legge.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="naspi-projections-table">
            <thead>
              <tr>
                <th>Data Bonifico</th>
                <th>Competenza</th>
                <th>Giorni</th>
                <th>Importo Ricevuto</th>
                <th>Stima Teorica</th>
                <th>Scostamento</th>
                <th>Verifica Correttezza</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const check = verifyPaymentCorrectness(p, evaluation, payments);
                return (
                  <tr key={p.id}>
                    <td><strong>{new Date(p.paymentDate).toLocaleDateString('it-IT')}</strong></td>
                    <td>{p.competenceMonth}</td>
                    <td>{p.daysPaid || 30} gg</td>
                    <td><strong style={{ color: '#047857' }}>€ {p.amount.toFixed(2)}</strong></td>
                    <td style={{ color: '#64748b' }}>€ {check.expectedNet.toFixed(2)}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: check.difference >= 0 ? '#059669' : check.status === 'parziale' ? '#d97706' : '#dc2626',
                        }}
                      >
                        {check.difference >= 0 ? `+€ ${check.difference.toFixed(2)}` : `-€ ${Math.abs(check.difference).toFixed(2)}`}
                        {check.differencePercent !== 0 && ` (${check.differencePercent > 0 ? '+' : ''}${check.differencePercent}%)`}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className={`payment-status-badge ${check.status}`}>
                          {check.status === 'conforme' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertTriangle size={12} />
                          )}
                          {check.statusLabel}
                        </span>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          {check.explanation}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="card-action-btn delete"
                        onClick={() => onRemovePayment(p.id)}
                        title="Rimuovi bonifico"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
