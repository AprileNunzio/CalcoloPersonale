import { Heart, Baby } from 'lucide-react';

interface WizardStepFamilyProps {
  hasSpouse: boolean;
  setHasSpouse: (v: boolean) => void;
  spouseName: string;
  setSpouseName: (v: string) => void;
  spouseBirthDate: string;
  setSpouseBirthDate: (v: string) => void;
  childrenCount: number;
  setChildrenCount: (v: number) => void;
  childrenUnder12: number;
  setChildrenUnder12: (v: number) => void;
  hasLaw68: boolean;
  setHasLaw68: (v: boolean) => void;
  hasMilitaryReserve: boolean;
  setHasMilitaryReserve: (v: boolean) => void;
}

export function WizardStepFamily({
  hasSpouse,
  setHasSpouse,
  spouseName,
  setSpouseName,
  spouseBirthDate,
  setSpouseBirthDate,
  childrenCount,
  setChildrenCount,
  childrenUnder12,
  setChildrenUnder12,
  hasLaw68,
  setHasLaw68,
  hasMilitaryReserve,
  setHasMilitaryReserve,
}: WizardStepFamilyProps) {
  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 18 }}>
        <h2>Situazione Familiare, Preferenze & Riserve di Legge</h2>
        <p className="muted">
          I carichi di famiglia e le riserve di legge sono fondamentali nelle graduatorie: <strong>a parità di punteggio, chi ha figli o preferenze viene convocato prima!</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* SPOUSE SECTION */}
        <div className="panel" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart size={20} color="var(--primary)" />
              <h4 style={{ margin: 0, fontSize: 15 }}>Coniuge / Partner convivente</h4>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={hasSpouse}
                onChange={e => setHasSpouse(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Presente
            </label>
          </div>
          {hasSpouse && (
            <div className="fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label>
                Nome e Cognome Coniuge
                <input
                  type="text"
                  value={spouseName}
                  onChange={e => setSpouseName(e.target.value)}
                  placeholder="es. Sarna Angelika Karolina"
                />
              </label>
              <label>
                Data di Nascita Coniuge
                <input
                  type="date"
                  value={spouseBirthDate}
                  onChange={e => setSpouseBirthDate(e.target.value)}
                />
              </label>
              <p className="muted" style={{ gridColumn: '1 / -1', fontSize: 12, margin: 0 }}>
                Benefici riconosciuti: Congedo straordinario per matrimonio (15 gg retribuiti), permessi per motivi familiari (3 gg retribuiti/anno), e <strong>+6 punti di ricongiungimento familiare</strong> nelle graduatorie d’istituto/mobilità comunale.
              </p>
            </div>
          )}
        </div>

        {/* CHILDREN SECTION */}
        <div className="panel" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Baby size={20} color="var(--primary)" />
            <h4 style={{ margin: 0, fontSize: 15 }}>Figli a Carico & Congedo Parentale</h4>
          </div>
          <div className="fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label>
              Numero Totale di Figli a Carico
              <input
                type="number"
                min={0}
                max={10}
                value={childrenCount}
                onChange={e => {
                  const c = Number(e.target.value);
                  setChildrenCount(c);
                  if (childrenUnder12 > c) setChildrenUnder12(c);
                }}
              />
            </label>

            <label>
              Di cui di età inferiore a 12 anni
              <input
                type="number"
                min={0}
                max={childrenCount}
                value={childrenUnder12}
                onChange={e => setChildrenUnder12(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="wizard-info-callout" style={{ marginTop: 12, padding: 12 }}>
            <p style={{ fontSize: 12 }}>
              <strong>Diritto al Congedo Parentale (D.Lgs. 151/2001 e D.Lgs. 105/2022):</strong> spetta solo per i figli <strong>fino a 12 anni di vita</strong> (fino a 10 mesi complessivi tra i genitori, elevabili a 11 con il bonus padre, e primi 30 giorni retribuiti al 100% nel comparto scuola). Superati i 12 anni, il diritto per legge decade automaticamente.
            </p>
          </div>
        </div>

        {/* RESERVES */}
        <div className="panel" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Riserve e Precedenze di Legge</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasLaw68}
                onChange={e => setHasLaw68(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Riserva Legge 68/99 (Invalidità civile o categorie protette con diritto alla quota di riserva di posti).</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasMilitaryReserve}
                onChange={e => setHasMilitaryReserve(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Riserva 15% Volontari Forze Armate (VFP1/VFP4 o servizio di leva militare concluso senza demerito).</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
