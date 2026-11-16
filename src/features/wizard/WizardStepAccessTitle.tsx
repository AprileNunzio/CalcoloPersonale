interface WizardStepAccessTitleProps {
  accessTitleName: string;
  setAccessTitleName: (v: string) => void;
  accessSchool: string;
  setAccessSchool: (v: string) => void;
  accessYear: string;
  setAccessYear: (v: string) => void;
  scoreBase: number;
  setScoreBase: (v: number) => void;
  scoreAchieved: number;
  setScoreAchieved: (v: number) => void;
  hasHonors: boolean;
  setHasHonors: (v: boolean) => void;
  computedAccessScore: number;
}

export function WizardStepAccessTitle({
  accessTitleName,
  setAccessTitleName,
  accessSchool,
  setAccessSchool,
  accessYear,
  setAccessYear,
  scoreBase,
  setScoreBase,
  scoreAchieved,
  setScoreAchieved,
  hasHonors,
  setHasHonors,
  computedAccessScore,
}: WizardStepAccessTitleProps) {
  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 18 }}>
        <h2>Titolo di Studio di Accesso & Calcolo del Punteggio</h2>
        <p className="muted">
          Il titolo di accesso è il diploma o attestato con cui ti inserisci nella graduatoria. La normativa ministeriale converte la votazione in base 10 con una formula precisa.
        </p>
      </div>

      <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <div className="fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <label>
            Tipologia Titolo
            <select value={accessTitleName} onChange={e => setAccessTitleName(e.target.value)}>
              <option value="Diploma di Maturità Quinquennale">Diploma di Maturità Quinquennale (Liceo, Tecnico, Professionale)</option>
              <option value="Qualifica Professionale Triennale">Qualifica Professionale Triennale (Regionale o IeFP)</option>
              <option value="Diploma di Istruzione Superiore (Vecchio Ordinamento)">Diploma Vecchio Ordinamento (Base 60)</option>
              <option value="Licenza di Scuola Media">Licenza Media (valida se già inseriti nel 2008)</option>
            </select>
          </label>

          <label>
            Istituto Scolastico / Ente
            <input
              type="text"
              value={accessSchool}
              onChange={e => setAccessSchool(e.target.value)}
              placeholder="es. I.I.S. Leonardo da Vinci"
            />
          </label>

          <label>
            Anno di Conseguimento
            <input
              type="number"
              min={1960}
              max={2030}
              value={accessYear}
              onChange={e => setAccessYear(e.target.value)}
              placeholder="es. 2018"
            />
          </label>

          <label>
            Base del Voto
            <select
              value={scoreBase}
              onChange={e => {
                const b = Number(e.target.value);
                setScoreBase(b);
                if (scoreAchieved > b) setScoreAchieved(b);
              }}
            >
              <option value={100}>Su 100 (Maturità recente)</option>
              <option value={60}>Su 60 (Vecchio ordinamento)</option>
              <option value={10}>Su 10 (Decimi)</option>
              <option value={30}>Su 30 (Qualifiche particolari)</option>
            </select>
          </label>

          <label>
            Voto Conseguito *
            <input
              type="number"
              step="any"
              min={1}
              max={scoreBase}
              value={scoreAchieved}
              onChange={e => setScoreAchieved(Number(e.target.value))}
            />
          </label>

          <label style={{ justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasHonors}
                onChange={e => setHasHonors(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Conseguito con Lode
            </span>
          </label>
        </div>
      </div>

      {/* LIVE MINISTERIAL FORMULA EXPLANATION */}
      <div className="wizard-score-banner">
        <div className="wizard-score-info">
          <h4>Formula Ministeriale del Punteggio</h4>
          <p>
            Formula ufficiale: <code>(Voto Conseguito / Base) × 10</code>.
            <br />
            Esempio applicato al tuo titolo: <code>({scoreAchieved} / {scoreBase}) × 10 = {computedAccessScore} punti</code>.
          </p>
        </div>
        <div className="wizard-score-badge">
          <strong>{computedAccessScore}</strong>
          <small>Punti Titolo</small>
        </div>
      </div>
    </div>
  );
}
