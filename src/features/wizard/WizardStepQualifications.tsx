interface WizardStepQualificationsProps {
  selectedProfile: string;
  hasCiad: boolean;
  setHasCiad: (v: boolean) => void;
  hasDigitalCert: boolean;
  setHasDigitalCert: (v: boolean) => void;
  hasTypingCourse: boolean;
  setHasTypingCourse: (v: boolean) => void;
  hasDegree: boolean;
  setHasDegree: (v: boolean) => void;
  hasPublicContest: boolean;
  setHasPublicContest: (v: boolean) => void;
  computedCulturalScore: number;
}

export function WizardStepQualifications({
  selectedProfile,
  hasCiad,
  setHasCiad,
  hasDigitalCert,
  setHasDigitalCert,
  hasTypingCourse,
  setHasTypingCourse,
  hasDegree,
  setHasDegree,
  hasPublicContest,
  setHasPublicContest,
  computedCulturalScore,
}: WizardStepQualificationsProps) {
  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 18 }}>
        <h2>Certificazione Digitale (CIAD) & Titoli Culturali</h2>
        <p className="muted">
          Le certificazioni informatiche e i titoli universitari arricchiscono il tuo punteggio. Verifica i requisiti per il profilo <strong>{selectedProfile}</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* CIAD */}
        <div
          className="panel"
          style={{
            padding: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            borderColor: hasCiad ? '#10b981' : '#dfe9e5',
          }}
        >
          <input
            type="checkbox"
            id="chk-ciad"
            checked={hasCiad}
            onChange={e => setHasCiad(e.target.checked)}
            style={{ width: 20, height: 20, marginTop: 3 }}
          />
          <div style={{ flex: 1 }}>
            <label htmlFor="chk-ciad" style={{ fontSize: 15, fontWeight: 700, color: '#163c35', cursor: 'pointer' }}>
              Certificazione Internazionale di Alfabetizzazione Digitale (CIAD - Accredia)
            </label>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              {selectedProfile === 'CS'
                ? 'Facoltativa per Collaboratore Scolastico (non obbligatoria per lavorare come CS).'
                : 'Requisito D’ACCESSO OBBLIGATORIO ai sensi del CCNL 2024 per AA, AT, OS, Cuoco, ecc. Senza CIAD si decade dalla graduatoria se non acquisita entro 1 anno.'}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: hasCiad ? '#059669' : '#6b7280' }}>
            {hasCiad ? 'Posseduta ✓' : 'Non posseduta'}
          </span>
        </div>

        {/* DIGITALE AGGIUNTIVA */}
        <div
          className="panel"
          style={{
            padding: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <input
            type="checkbox"
            id="chk-cert"
            checked={hasDigitalCert}
            onChange={e => setHasDigitalCert(e.target.checked)}
            style={{ width: 20, height: 20, marginTop: 3 }}
          />
          <div style={{ flex: 1 }}>
            <label htmlFor="chk-cert" style={{ fontSize: 15, fontWeight: 700, color: '#163c35', cursor: 'pointer' }}>
              Certificazione Informatica aggiuntiva (EIPASS, ICDL/ECDL, PEKIT, IDCERT, DigComp)
            </label>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              Valutabile per una sola certificazione: assegna <strong>+{selectedProfile === 'CS' ? '0.30' : '0.60'} punti</strong>.
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#116b62' }}>
            +{selectedProfile === 'CS' ? '0.30' : '0.60'} pt
          </span>
        </div>

        {/* DATTILOGRAFIA (SOLO AA) */}
        {selectedProfile === 'AA' && (
          <div
            className="panel"
            style={{
              padding: 18,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              background: '#f0fdf4',
              borderColor: '#86efac',
            }}
          >
            <input
              type="checkbox"
              id="chk-datt"
              checked={hasTypingCourse}
              onChange={e => setHasTypingCourse(e.target.checked)}
              style={{ width: 20, height: 20, marginTop: 3 }}
            />
            <div style={{ flex: 1 }}>
              <label htmlFor="chk-datt" style={{ fontSize: 15, fontWeight: 700, color: '#14532d', cursor: 'pointer' }}>
                Corso di Addestramento Professionale per la Dattilografia (Solo per AA)
              </label>
              <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
                Assegna <strong>+1.00 punto intero</strong> per la graduatoria di Assistente Amministrativo (se rilasciato da Ente Pubblico o consorzio abilitato).
              </p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
              +1.00 pt
            </span>
          </div>
        )}

        {/* LAUREA */}
        <div
          className="panel"
          style={{
            padding: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <input
            type="checkbox"
            id="chk-degree"
            checked={hasDegree}
            onChange={e => setHasDegree(e.target.checked)}
            style={{ width: 20, height: 20, marginTop: 3 }}
          />
          <div style={{ flex: 1 }}>
            <label htmlFor="chk-degree" style={{ fontSize: 15, fontWeight: 700, color: '#163c35', cursor: 'pointer' }}>
              Diploma di Laurea (Triennale, Magistrale o Vecchio Ordinamento)
            </label>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              Assegna <strong>+2.00 punti</strong> per Assistente Amministrativo e Assistente Tecnico.
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#116b62' }}>
            +2.00 pt
          </span>
        </div>

        {/* IDONEITÀ CONCORSO */}
        <div
          className="panel"
          style={{
            padding: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <input
            type="checkbox"
            id="chk-contest"
            checked={hasPublicContest}
            onChange={e => setHasPublicContest(e.target.checked)}
            style={{ width: 20, height: 20, marginTop: 3 }}
          />
          <div style={{ flex: 1 }}>
            <label htmlFor="chk-contest" style={{ fontSize: 15, fontWeight: 700, color: '#163c35', cursor: 'pointer' }}>
              Idoneità in precedente concorso pubblico per il medesimo profilo
            </label>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              Assegna <strong>+1.00 punto</strong>.
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#116b62' }}>
            +1.00 pt
          </span>
        </div>
      </div>

      <div className="wizard-score-banner" style={{ marginTop: 20 }}>
        <div className="wizard-score-info">
          <h4>Totale Titoli Culturali</h4>
          <p>I punti dei titoli culturali e informatici si sommano direttamente al titolo di studio d'accesso.</p>
        </div>
        <div className="wizard-score-badge">
          <strong>+{computedCulturalScore}</strong>
          <small>Punti Titoli</small>
        </div>
      </div>
    </div>
  );
}
