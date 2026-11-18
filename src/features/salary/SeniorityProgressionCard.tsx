import { TrendingUp, Award, Calendar, ChevronRight, Zap } from 'lucide-react';
import { CareerSeniorityResult, SalaryFascia, FASCIA_LIMITS } from './salaryCalculations';
import './SeniorityTfr.css';

interface SeniorityProgressionCardProps {
  seniority: CareerSeniorityResult;
  selectedFascia: SalaryFascia;
  onSelectFascia: (fascia: SalaryFascia) => void;
  profileLabel: string;
}

export function SeniorityProgressionCard({
  seniority,
  selectedFascia,
  onSelectFascia,
  profileLabel,
}: SeniorityProgressionCardProps) {
  const isAuto = selectedFascia === seniority.currentFascia;

  return (
    <div className="seniority-progression-card">
      <div className="seniority-card-header">
        <div className="seniority-card-title">
          <TrendingUp size={20} color="var(--secondary)" />
          <div>
            <h4>Progressione di Carriera & Fasce CCNL 2024 ({profileLabel})</h4>
            <span className="seniority-subtitle">
              Calcolo automatico dell'anzianità di servizio e scatti stipendiali maturati
            </span>
          </div>
        </div>

        <div className="seniority-active-badge">
          <Award size={15} />
          <span>Fascia Attuale: <strong>{seniority.currentFascia} anni</strong></span>
        </div>
      </div>

      <div className="seniority-stats-row">
        <div className="seniority-stat-box">
          <span className="stat-label">Anzianità Giuridica Totale</span>
          <span className="stat-value">
            {seniority.recognizedYears} anni {seniority.recognizedMonths} mesi
          </span>
          <span className="stat-sub">({seniority.totalServiceDays} giorni registrati)</span>
        </div>

        <div className="seniority-stat-box">
          <span className="stat-label">Anni Scolastici Utili (&ge; 180 gg)</span>
          <span className="stat-value">{seniority.fullSchoolYearsCount} anni</span>
          <span className="stat-sub">Validi per ricostruzione carriera</span>
        </div>

        <div className="seniority-stat-box highlight">
          <span className="stat-label">Prossimo Scatto di Fascia</span>
          {seniority.nextFascia ? (
            <>
              <span className="stat-value" style={{ color: 'var(--secondary)' }}>
                Fascia {seniority.nextFascia}
              </span>
              <span className="stat-sub">
                Mancano {seniority.yearsRemainingToNext}a {seniority.monthsRemainingToNext}m (+{seniority.monthlyGrossIncreaseOnNext}€/m)
              </span>
            </>
          ) : (
            <>
              <span className="stat-value" style={{ color: 'var(--secondary)' }}>Fascia Massima</span>
              <span className="stat-sub">Oltre 35 anni di anzianità</span>
            </>
          )}
        </div>
      </div>

      {seniority.nextFascia && (
        <div className="seniority-progress-bar-wrap">
          <div className="progress-bar-labels">
            <span>Avanzamento scatto verso Fascia {seniority.nextFascia}</span>
            <strong>{seniority.progressPercent}%</strong>
          </div>
          <div className="seniority-progress-track">
            <div
              className="seniority-progress-fill"
              style={{ width: `${Math.max(4, seniority.progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Fascia interactive selector pills */}
      <div className="fascia-selector-container">
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
          Simula Busta Paga per Fascia Stipendiale CCNL:
        </span>
        <div className="fascia-pills-row">
          {FASCIA_LIMITS.map(f => {
            const isCalculated = f.fascia === seniority.currentFascia;
            const isSelected = f.fascia === selectedFascia;
            return (
              <button
                key={f.fascia}
                type="button"
                className={`fascia-pill-btn ${isSelected ? 'selected' : ''} ${isCalculated ? 'calculated' : ''}`}
                onClick={() => onSelectFascia(f.fascia)}
              >
                <span>{f.fascia} anni</span>
                {isCalculated && <span className="fascia-auto-tag">Tua Fascia</span>}
              </button>
            );
          })}
        </div>
        {!isAuto && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={13} />
            <span>
              Stai simulando una fascia manuale ({selectedFascia}). Clicca su "Tua Fascia" ({seniority.currentFascia}) per tornare alla tua anzianità reale.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
