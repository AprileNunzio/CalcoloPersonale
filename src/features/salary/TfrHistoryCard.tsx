import { useState } from 'react';
import { PiggyBank, Calendar, Clock, ChevronDown, ChevronUp, Info, ShieldCheck } from 'lucide-react';
import { CumulativeTfrResult } from './salaryCalculations';
import './SeniorityTfr.css';

interface TfrHistoryCardProps {
  tfrData: CumulativeTfrResult;
}

export function TfrHistoryCard({ tfrData }: TfrHistoryCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="tfr-history-card">
      <div className="tfr-card-header">
        <div className="tfr-card-title">
          <PiggyBank size={22} color="#0d9488" />
          <div>
            <h4>Trattamento di Fine Rapporto (TFR) Storico Pluriennale</h4>
            <span className="tfr-subtitle">
              Calcolo automatico del TFR maturato su tutti i contratti registrati (Art. 2120 c.c. / CCNL)
            </span>
          </div>
        </div>

        <div className="tfr-contracts-badge">
          <ShieldCheck size={14} />
          <span>{tfrData.contractsCount} Contratti Calcolati</span>
        </div>
      </div>

      <div className="tfr-metrics-deck">
        <div className="tfr-metric-box primary">
          <span className="tfr-metric-label">TFR Netto Totale Stimato in Tasca</span>
          <span className="tfr-metric-value">€ {tfrData.totalNetTfr.toFixed(2)}</span>
          <span className="tfr-metric-sub">Al netto della tassazione separata IRPEF media (~19%)</span>
        </div>

        <div className="tfr-metric-box">
          <span className="tfr-metric-label">TFR Lordo Maturato Complessivo</span>
          <span className="tfr-metric-value">€ {tfrData.totalGrossTfr.toFixed(2)}</span>
          <span className="tfr-metric-sub">Retribuzioni utili annue / 13.5</span>
        </div>

        <div className="tfr-metric-box">
          <span className="tfr-metric-label">Tempi Liquidazione INPS</span>
          <span className="tfr-metric-value" style={{ fontSize: 16 }}>12 - 24 Mesi</span>
          <span className="tfr-metric-sub">Dalla data di cessazione del contratto a termine</span>
        </div>
      </div>

      {tfrData.items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="tfr-toggle-table-btn"
            onClick={() => setShowTable(!showTable)}
          >
            <span>{showTable ? 'Nascondi Dettaglio Contratti' : 'Mostra Dettaglio TFR per Singolo Contratto / Anno'}</span>
            {showTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTable && (
            <div className="tfr-table-wrap">
              <table className="tfr-breakdown-table">
                <thead>
                  <tr>
                    <th>Anno Scolastico</th>
                    <th>Periodo Servizio</th>
                    <th>Mesi Utili</th>
                    <th>Retribuzione Utile Lorda</th>
                    <th>TFR Lordo Spettante</th>
                    <th>TFR Netto Stimato</th>
                  </tr>
                </thead>
                <tbody>
                  {tfrData.items.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.schoolYear}</strong></td>
                      <td>{item.periodLabel}</td>
                      <td>{item.monthsCount} mesi</td>
                      <td>€ {item.grossUsefulSalary.toFixed(2)}</td>
                      <td><strong>€ {item.tfrGross.toFixed(2)}</strong></td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>€ {item.tfrNetEstimated.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="tfr-info-footer">
        <Info size={15} style={{ flexShrink: 0, color: '#0d9488' }} />
        <span>
          <strong>Come viene liquidato il TFR nella Scuola:</strong> Per i supplenti temporanei o fino al 30 giugno/31 agosto, il modello TFR-1 viene inviato telematicamente dalla scuola tramite NoiPA all'INPS Gestione Dipendenti Pubblici. L'accredito avviene automaticamente sul proprio IBAN senza necessità di presentare domanda cartacea.
        </span>
      </div>
    </div>
  );
}
