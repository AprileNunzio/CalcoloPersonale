import { Plus, Trash2, Clock } from 'lucide-react';
import { WizardServiceItem } from './types';

interface WizardStepServicesProps {
  services: WizardServiceItem[];
  selectedProfile: string;
  newSchoolName: string;
  setNewSchoolName: (v: string) => void;
  newIsStatale: boolean;
  setNewIsStatale: (v: boolean) => void;
  newServiceProfile: string;
  setNewServiceProfile: (v: string) => void;
  newStartDate: string;
  setNewStartDate: (v: string) => void;
  newEndDate: string;
  setNewEndDate: (v: string) => void;
  handleAddService: () => void;
  handleRemoveService: (id: string) => void;
  computedServiceScore: number;
}

export function WizardStepServices({
  services,
  selectedProfile,
  newSchoolName,
  setNewSchoolName,
  newIsStatale,
  setNewIsStatale,
  newServiceProfile,
  setNewServiceProfile,
  newStartDate,
  setNewStartDate,
  newEndDate,
  setNewEndDate,
  handleAddService,
  handleRemoveService,
  computedServiceScore,
}: WizardStepServicesProps) {
  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 18 }}>
        <h2>Servizio Lavorativo Pregresso nella Scuola</h2>
        <p className="muted">
          Aggiungi i contratti e le supplenze svolte. Il sistema applica automaticamente la <strong>regola dei 16 giorni</strong>: ogni frazione pari o superiore a 16 giorni viene calcolata come 1 mese intero!
        </p>
      </div>

      {/* ADD SERVICE FORM */}
      <div className="panel" style={{ padding: 20, marginBottom: 20, background: 'var(--surface-container-high)' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Aggiungi Periodo di Lavoro</h4>
        <div className="fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <label>
            Scuola / Istituto
            <input
              type="text"
              value={newSchoolName}
              onChange={e => setNewSchoolName(e.target.value)}
              placeholder="es. I.C. Statale Firenze Nord"
            />
          </label>

          <label>
            Tipologia Istituzione
            <select
              value={newIsStatale ? 'statale' : 'paritaria'}
              onChange={e => setNewIsStatale(e.target.value === 'statale')}
            >
              <option value="statale">Scuola Statale (100% punteggio)</option>
              <option value="paritaria">Scuola Paritaria (50% punteggio)</option>
            </select>
          </label>

          <label>
            Profilo Svolto
            <select
              value={newServiceProfile}
              onChange={e => setNewServiceProfile(e.target.value)}
            >
              <option value="CS">Collaboratore Scolastico (CS)</option>
              <option value="AA">Assistente Amministrativo (AA)</option>
              <option value="AT">Assistente Tecnico (AT)</option>
              <option value="OS">Operatore Scolastico (OS)</option>
            </select>
          </label>

          <label>
            Data Inizio
            <input
              type="date"
              value={newStartDate}
              onChange={e => setNewStartDate(e.target.value)}
            />
          </label>

          <label>
            Data Fine
            <input
              type="date"
              value={newEndDate}
              onChange={e => setNewEndDate(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={handleAddService}
              style={{ width: '100%', height: 42, background: 'var(--primary)' }}
            >
              <Plus size={16} /> Aggiungi Contratto
            </button>
          </div>
        </div>
      </div>

      {/* LIST OF SERVICES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', border: '1.5px dashed var(--outline-variant)', borderRadius: 12 }}>
            <Clock size={32} color="var(--on-surface-variant)" style={{ marginBottom: 6 }} />
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Nessun servizio registrato finora. Se hai già lavorato nella scuola, inserisci i tuoi contratti sopra per calcolare i punti!
            </p>
          </div>
        ) : (
          services.map(s => (
            <div
              key={s.id}
              className="panel"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: 0,
              }}
            >
              <div>
                <strong>{s.schoolName}</strong>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  {s.start} → {s.end} · {s.isStatale ? 'Statale' : 'Paritaria'} · Profilo {s.profile}
                  {s.profile === selectedProfile ? ' (Specifico)' : ' (Aspecifico)'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--secondary)' }}>
                    +{s.pointsCalculated} pt
                  </span>
                  <small style={{ display: 'block', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    {s.monthsCalculated} {s.monthsCalculated === 1 ? 'mese' : 'mesi'}
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary danger"
                  onClick={() => handleRemoveService(s.id)}
                  style={{ padding: 6, borderRadius: 6 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="wizard-score-banner" style={{ marginTop: 20 }}>
        <div className="wizard-score-info">
          <h4>Totale Punteggio Servizio</h4>
          <p>Massimo maturabile per anno scolastico: 6.00 punti per CS, 7.20 punti per AA e AT.</p>
        </div>
        <div className="wizard-score-badge">
          <strong>+{computedServiceScore}</strong>
          <small>Punti Servizio</small>
        </div>
      </div>
    </div>
  );
}
