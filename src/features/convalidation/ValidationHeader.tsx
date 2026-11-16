import { Info } from 'lucide-react';
import { MinisterialDecree } from '../../shared/scoring';

interface ValidationHeaderProps {
  decree: MinisterialDecree;
  onDecreeChange: (decree: MinisterialDecree) => void;
}

export function ValidationHeader({ decree, onDecreeChange }: ValidationHeaderProps) {
  return (
    <div className="validation-header-pane">
      <h2>Convalida Punteggi & Calcolo Normativo ATA</h2>
      <p>
        In conformità con l’art. 6 comma 11 del D.M. 89/2024 e D.M. 50/2021, la scuola verifica e convalida i titoli dichiarati con Decreto Dirigenziale. Se hai convalide di anni precedenti (es. 2021 o 2017) puoi attivare la <strong>Base Consolidata</strong>: il software congelerà quel punteggio e calcolerà in automatico solo i contratti e i titoli maturati dopo quella data!
      </p>

      <div className="decree-selector-strip">
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
          Normativa Applicata:
        </span>
        <button
          type="button"
          className={`decree-btn ${decree === 'DM_89_2024' ? 'active' : ''}`}
          onClick={() => onDecreeChange('DM_89_2024')}
        >
          D.M. 89/2024 (Triennio 2024-2027 • Vigente)
        </button>
        <button
          type="button"
          className={`decree-btn ${decree === 'DM_50_2021' ? 'active' : ''}`}
          onClick={() => onDecreeChange('DM_50_2021')}
        >
          D.M. 50/2021 (Triennio 2021-2023)
        </button>
        <button
          type="button"
          className={`decree-btn ${decree === 'DM_640_2017' ? 'active' : ''}`}
          onClick={() => onDecreeChange('DM_640_2017')}
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
  );
}
