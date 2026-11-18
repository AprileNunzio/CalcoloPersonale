import { Activity, Clock3, AlertCircle, FileText } from 'lucide-react';
import { useT } from '../../shared/i18n';
import { ContractType } from '../../shared/entitlements';

export interface DashboardEntitlementsPaneProps {
  entitlements: any;
  setContractOverride: (type: ContractType) => void;
}

export function DashboardEntitlementsPane({
  entitlements,
  setContractOverride,
}: DashboardEntitlementsPaneProps) {
  const t = useT();

  return (
    <div className="step-pane step-entitlements-pane">
      <div className="contract-selector-strip">
        <span className="contract-strip-label">{t('contractType')}:</span>
        <div className="contract-pill-group">
          <button
            type="button"
            className={`contract-pill-btn ${entitlements.contractType === 'permanent' ? 'active' : ''}`}
            onClick={() => setContractOverride('permanent')}
          >
            {t('permanentContract')}
          </button>
          <button
            type="button"
            className={`contract-pill-btn ${entitlements.contractType === 'annual' ? 'active' : ''}`}
            onClick={() => setContractOverride('annual')}
          >
            {t('annualContract')}
          </button>
          <button
            type="button"
            className={`contract-pill-btn ${entitlements.contractType === 'short' ? 'active' : ''}`}
            onClick={() => setContractOverride('short')}
          >
            {t('shortContract')}
          </button>
        </div>
      </div>

      <div className="entitlements-cards-grid">
        <div className="panel entitlement-card">
          <div className="entitlement-card-header">
            <div className="entitlement-header-title">
              <Activity size={18} />
              <h4>{t('sicknessAllowance')}</h4>
            </div>
            <span className="statutory-pill">{entitlements.totalComportoDays} {t('days')} {t('statutoryLimit')}</span>
          </div>

          <div className="entitlement-progress-container">
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${entitlements.isOverComporto ? 'danger' : ''}`}
                style={{
                  width: `${Math.min(100, Math.round((entitlements.usedSicknessDays / Math.max(1, entitlements.totalComportoDays)) * 100))}%`,
                }}
              />
            </div>
            <div className="progress-bar-legend">
              <span>{t('used')}: <strong>{entitlements.usedSicknessDays} {t('days')}</strong></span>
              <span>{t('remaining')}: <strong>{entitlements.remainingComportoDays} {t('days')}</strong></span>
            </div>
          </div>

          {entitlements.isOverComporto && (
            <div className="comporto-alert danger">
              <AlertCircle size={16} />
              <span>{t('overComportoWarning')}</span>
            </div>
          )}

          <div className="brackets-breakdown-list">
            <div className="bracket-item">
              <div className="bracket-info">
                <span className="bracket-dot b-100" />
                <span className="bracket-title">
                  {entitlements.contractType === 'annual'
                    ? '1° mese (1-30 gg): 100% stipendio'
                    : entitlements.contractType === 'short'
                    ? '1° scaglione (non applicabile)'
                    : 'Primi 9 mesi (1-270 gg): 100%'}
                </span>
              </div>
              <span className="bracket-value">
                {entitlements.bracket1DaysUsed} / {entitlements.bracket1Max} {t('days')}
              </span>
            </div>
            <div className="bracket-item">
              <div className="bracket-info">
                <span className="bracket-dot b-90" />
                <span className="bracket-title">
                  {entitlements.contractType === 'annual'
                    ? '2°-3° mese (31-90 gg): 50% stipendio'
                    : entitlements.contractType === 'short'
                    ? 'Max 30 gg: 50% stipendio'
                    : 'Succ. 3 mesi (271-360 gg): 90%'}
                </span>
              </div>
              <span className="bracket-value">
                {entitlements.bracket2DaysUsed} / {entitlements.bracket2Max} {t('days')}
              </span>
            </div>
            <div className="bracket-item">
              <div className="bracket-info">
                <span className="bracket-dot b-50" />
                <span className="bracket-title">
                  {entitlements.contractType === 'annual'
                    ? '4°-9° mese (91-270 gg): 0% (posto conservato)'
                    : entitlements.contractType === 'short'
                    ? 'Oltre 30 gg: Risoluzione contratto'
                    : 'Ulteriori 6 mesi (361-540 gg): 50%'}
                </span>
              </div>
              <span className="bracket-value">
                {entitlements.bracket3DaysUsed} / {entitlements.bracket3Max} {t('days')}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.4, background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            {entitlements.contractType === 'annual'
              ? 'Normativa CCNL Scuola Art. 19 c. 3 (supplenze fino al 30/06 o 31/08): assenze per malattia max 9 mesi nel triennio scolastico (primi 30 gg retribuiti al 100%, dal 31° al 90° giorno al 50%, dal 91° al 270° giorno allo 0% con diritto alla sola conservazione del posto).'
              : entitlements.contractType === 'short'
              ? 'Normativa CCNL Scuola Art. 19 c. 7-10 (supplenze brevi e saltuarie): max 30 giorni per anno scolastico retribuiti al 50% con conservazione del posto.'
              : 'Normativa CCNL Scuola Art. 17 (tempo indeterminato): 18 mesi nel triennio scolastico (9 mesi al 100%, 3 mesi al 90%, 6 mesi al 50%).'}
          </div>
        </div>

        <div className="panel entitlement-card">
          <div className="entitlement-card-header">
            <div className="entitlement-header-title">
              <Clock3 size={18} />
              <h4>{t('specialistVisits')}</h4>
            </div>
            <span className="statutory-pill">{entitlements.totalSpecialistHours} {t('hours')}</span>
          </div>

          <div className="entitlement-progress-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill specialist"
                style={{
                  width: `${Math.min(100, Math.round((entitlements.usedSpecialistHours / Math.max(1, entitlements.totalSpecialistHours)) * 100))}%`,
                }}
              />
            </div>
            <div className="progress-bar-legend">
              <span>{t('used')}: <strong>{entitlements.usedSpecialistHours} {t('hours')}</strong></span>
              <span>{t('remaining')}: <strong>{entitlements.remainingSpecialistHours} {t('hours')}</strong></span>
            </div>
          </div>

          <div className="statutory-rules-box">
            <div className="statutory-rules-title">
              <FileText size={14} />
              <strong>{t('whatHappensAfter')}</strong>
            </div>
            <p>{t('whatHappensAfterText')}</p>
            <small className="muted">{t('ccnlReference')}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
