import React from 'react';
import { Info, X, CheckCircle2, Calendar, FileText, Scale } from 'lucide-react';
import { ServiceDurationDetails } from './serviceCalculations';

export interface ServiceLegalCalcBoxProps {
  details: ServiceDurationDetails;
  profile: string;
  scoreSpecificPerMonth: number;
  totalSpecificScore: number;
  onClose: () => void;
}

export function ServiceLegalCalcBox({
  details,
  profile,
  scoreSpecificPerMonth,
  totalSpecificScore,
  onClose,
}: ServiceLegalCalcBoxProps) {
  const yearsText = details.calendarYears > 0 ? `${details.calendarYears} anni, ` : '';
  const calendarText = `${yearsText}${details.calendarMonths} mesi e ${details.calendarDays} giorni`;

  return (
    <div className="service-legal-calc-box" role="region" aria-label="Spiegazione calcolo punteggio ATA">
      <div className="legal-calc-header">
        <div className="legal-calc-title">
          <Scale size={16} />
          <strong>Normativa ATA: Calcolo Mesi e Punteggio (D.M. 89/2024 e D.M. 50/2021)</strong>
        </div>
        <button
          type="button"
          className="legal-calc-close-btn"
          onClick={onClose}
          aria-label="Chiudi dettaglio calcolo"
        >
          <X size={14} />
        </button>
      </div>

      <div className="legal-calc-steps">
        <div className="legal-calc-step">
          <div className="step-badge">1</div>
          <div className="step-content">
            <div className="step-title">
              <Calendar size={13} />
              <span>Durata effettiva di calendario</span>
            </div>
            <p className="step-desc">
              Il periodo comprende <strong>{details.totalDays} giorni effettivi</strong> continui di servizio ({calendarText}).
            </p>
          </div>
        </div>

        <div className="legal-calc-step">
          <div className="step-badge">2</div>
          <div className="step-content">
            <div className="step-title">
              <Scale size={13} />
              <span>Calcolo amministrativo su base 30 giorni</span>
            </div>
            <p className="step-desc">
              Nella Pubblica Amministrazione scolastica, la durata dei servizi è calcolata convenzionalmente su base mensile di 30 giorni:
              <br />
              <code className="legal-calc-formula">
                {details.totalDays} giorni ÷ 30 = <strong>{details.base30FullMonths} mesi interi</strong> ({details.base30FullMonths * 30} gg) con un resto di <strong>{details.base30RemainderDays} giorni</strong>
              </code>
            </p>
          </div>
        </div>

        <div className="legal-calc-step">
          <div className="step-badge">3</div>
          <div className="step-content">
            <div className="step-title">
              <CheckCircle2 size={13} />
              <span>Regola ministeriale della frazione (&gt; 15 giorni)</span>
            </div>
            <p className="step-desc">
              Ai sensi dell'art. 1 e Tabelle di valutazione Allegato A (D.M. 89/2024 e D.M. 50/2021), <em>«le frazioni di mese superiori a 15 giorni sono considerate come mese intero»</em>:
            </p>
            {details.isRoundedUp ? (
              <div className="legal-highlight-success">
                ✓ Il residuo di <strong>{details.base30RemainderDays} giorni</strong> è superiore a 15 (<strong>{details.base30RemainderDays} &gt; 15</strong>): dà diritto a <strong>+1 mese intero di punteggio</strong>.
                <br />
                Totale mesi valutabili: {details.base30FullMonths} + 1 = <strong>{details.scoreMonths} mesi</strong> (pari a <strong>+{totalSpecificScore.toFixed(2)} pt</strong> nel profilo {profile} a {scoreSpecificPerMonth.toFixed(2)} pt/mese).
              </div>
            ) : details.base30RemainderDays > 0 ? (
              <div className="legal-highlight-neutral">
                Il residuo di <strong>{details.base30RemainderDays} giorni</strong> è inferiore o pari a 15 (<strong>{details.base30RemainderDays} ≤ 15</strong>): non matura il mese aggiuntivo.
                <br />
                Totale mesi valutabili: <strong>{details.scoreMonths} mesi</strong> (pari a <strong>+{totalSpecificScore.toFixed(2)} pt</strong> nel profilo {profile}).
              </div>
            ) : (
              <div className="legal-highlight-neutral">
                Nessun giorno residuo: esattamente <strong>{details.scoreMonths} mesi interi</strong> (pari a <strong>+{totalSpecificScore.toFixed(2)} pt</strong>).
              </div>
            )}
          </div>
        </div>

        <div className="legal-calc-step annual-rule">
          <div className="step-badge info">📌</div>
          <div className="step-content">
            <div className="step-title">
              <FileText size={13} />
              <span>Come funziona il cumulo nella domanda ATA (Istanze Online / POLIS)</span>
            </div>
            <p className="step-desc">
              Se nello stesso anno scolastico svolgi più contratti o supplenze brevi spezzettate, i giorni di ciascun contratto vengono sommati insieme. Il calcolo della frazione (&gt; 15 giorni) si applica sul totale annuo complessivo dei giorni, fino al limite massimo consentito dalla legge di <strong>12 mesi (massimo 6,00 punti all'anno per CS o 7,20 punti per AA/AT)</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
