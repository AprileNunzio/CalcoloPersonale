import { Heart, Baby, CheckCircle, AlertCircle, Info, Users2 } from 'lucide-react';
import { ComprehensiveFamilyOverview } from '../../shared/familyLeave';

export function FamilyLeavePane({
  familyOverview,
}: {
  familyOverview: ComprehensiveFamilyOverview | null;
}) {
  return (
    <div className="dash-family-section">
      {/* 1. SPOUSES SECTION */}
      {familyOverview && familyOverview.spouses.length > 0 && (
        <div>
          <div className="dash-section-title-row">
            <h3>
              <Heart size={18} color="var(--primary)" />
              Coniuge / Partner Convivente
            </h3>
            <span className="dash-section-badge">Diritti CCNL e Mobilità</span>
          </div>

          <div className="dash-cards-grid">
            {familyOverview.spouses.map(spouse => (
              <div className="dash-spouse-card" key={spouse.memberId}>
                <div className="dash-spouse-header">
                  <div className="dash-person-info-row">
                    <div className="dash-avatar-circle spouse">
                      <Heart size={20} />
                    </div>
                    <div className="dash-person-names">
                      <h4>{spouse.fullName}</h4>
                      <small>
                        {spouse.birthDate ? `Data di nascita: ${spouse.birthDate}` : 'Coniuge registrato'}
                      </small>
                    </div>
                  </div>
                  <span className="dash-badge-pill spouse">
                    Coniuge / Partner
                  </span>
                </div>

                <div className="dash-entitlements-grid">
                  <div className="dash-entitlement-box highlight">
                    <span className="dash-ent-label">Congedo Matrimoniale</span>
                    <strong className="dash-ent-value">{spouse.marriageLeaveDays} giorni</strong>
                    <small className="muted" style={{ fontSize: 10 }}>Retribuiti al 100%</small>
                  </div>

                  <div className="dash-entitlement-box">
                    <span className="dash-ent-label">Permessi Familiari</span>
                    <strong className="dash-ent-value">{spouse.personalLeaveDays} gg / anno</strong>
                    <small className="muted" style={{ fontSize: 10 }}>+6 gg ferie fruibili</small>
                  </div>

                  <div className="dash-entitlement-box highlight">
                    <span className="dash-ent-label">Ricongiungimento</span>
                    <strong className="dash-ent-value">+{spouse.reunionScore} pt</strong>
                    <small className="muted" style={{ fontSize: 10 }}>Mobilità comunale</small>
                  </div>

                  {spouse.isDisability104 && (
                    <div className="dash-entitlement-box warning">
                      <span className="dash-ent-label">Legge 104/92</span>
                      <strong className="dash-ent-value">3 gg / mese</strong>
                      <small className="muted" style={{ fontSize: 10 }}>+ Congedo straordinario</small>
                    </div>
                  )}
                </div>

                <div className="dash-card-legal-note">
                  <Info size={16} style={{ flexShrink: 0, color: 'var(--primary)', marginTop: 2 }} />
                  <div>
                    <strong>Chiarimento normativo:</strong> Il congedo parentale (D.Lgs. 151/2001) è riservato esclusivamente alla cura dei figli. Per il coniuge si applicano il congedo matrimoniale, i permessi retribuiti e il punteggio di ricongiungimento (+6 pt).
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CHILDREN SECTION */}
      {familyOverview && familyOverview.childrenLeaves.length > 0 && (
        <div>
          <div className="dash-section-title-row">
            <h3>
              <Baby size={18} color="var(--primary)" />
              Figli a Carico & Congedo Parentale (D.Lgs. 151/2001 e D.Lgs. 105/2022)
            </h3>
            <span className="dash-section-badge">
              {familyOverview.totalEligibleChildren} con diritto attivo (&lt; 12 anni)
            </span>
          </div>

          <div className="dash-cards-grid">
            {familyOverview.childrenLeaves.map((child, idx) => {
              const pctUsed = child.maxSharedDays > 0
                ? Math.min(100, Math.round((child.totalUsedDays / child.maxSharedDays) * 100))
                : 0;

              return (
                <div
                  className={`dash-child-card ${!child.isEligibleUnder12 ? 'expired' : ''}`}
                  key={child.childId || idx}
                >
                  <div className="dash-spouse-header">
                    <div className="dash-person-info-row">
                      <div className={`dash-avatar-circle ${child.isEligibleUnder12 ? 'child' : 'expired'}`}>
                        <Baby size={20} />
                      </div>
                      <div className="dash-person-names">
                        <h4>{child.childName}</h4>
                        <small>
                          {child.birthDate ? `${child.birthDate} · ` : ''}
                          {child.ageYears > 0 ? `${child.ageYears} anni` : ''} {child.ageMonths > 0 ? `e ${child.ageMonths} mesi` : ''}
                        </small>
                      </div>
                    </div>
                    <span className={`dash-badge-pill ${child.isEligibleUnder12 ? 'child-active' : 'child-expired'}`}>
                      {child.isEligibleUnder12 ? 'Attivo fino a 12 anni' : 'Termine superato (> 12 anni)'}
                    </span>
                  </div>

                  {child.isEligibleUnder12 ? (
                    <>
                      <div className="dash-progress-wrap">
                        <div className="dash-progress-labels">
                          <span>Fruiti: {child.totalUsedDays} giorni</span>
                          <span>Residuo coppia: <strong>{child.remainingDays}</strong> / {child.maxSharedDays} gg</span>
                        </div>
                        <div className="dash-progress-bar">
                          <div
                            className="dash-progress-fill"
                            style={{ width: `${pctUsed}%` }}
                          />
                        </div>
                      </div>

                      <div className="dash-entitlements-grid">
                        <div className="dash-entitlement-box">
                          <span className="dash-ent-label">Fruiti Richiedente</span>
                          <strong className="dash-ent-value">{child.parentADays} gg</strong>
                        </div>
                        <div className="dash-entitlement-box">
                          <span className="dash-ent-label">Fruiti Altro Genitore</span>
                          <strong className="dash-ent-value">{child.parentBDays} gg</strong>
                        </div>
                        <div className="dash-entitlement-box highlight">
                          <span className="dash-ent-label">Residuo 100% Scuola</span>
                          <strong className="dash-ent-value">{child.schoolPaid100RemainingDays} gg</strong>
                          <small className="muted" style={{ fontSize: 10 }}>Primi 30 gg CCNL</small>
                        </div>
                        <div className="dash-entitlement-box">
                          <span className="dash-ent-label">Scadenza Diritto</span>
                          <strong className="dash-ent-value" style={{ fontSize: 12 }}>{child.deadline12Years || '12° anno'}</strong>
                        </div>
                      </div>

                      <div className="dash-card-legal-note">
                        <CheckCircle size={16} style={{ flexShrink: 0, color: 'var(--secondary)', marginTop: 2 }} />
                        <div>
                          <div><strong>{child.illnessRightsText}</strong></div>
                          <div style={{ marginTop: 2 }}>{child.legalNote}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="dash-card-legal-note" style={{ background: 'var(--tertiary-container)', borderColor: 'var(--outline-variant)' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, color: 'var(--tertiary)', marginTop: 2 }} />
                      <div>
                        <strong>Nessun congedo parentale residuo:</strong> {child.legalNote}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. EMPTY STATE IF NO FAMILY MEMBERS */}
      {(!familyOverview || (familyOverview.spouses.length === 0 && familyOverview.childrenLeaves.length === 0)) && (
        <div className="panel empty-step-card">
          <Users2 size={36} color="var(--on-surface-variant)" />
          <h4>Nessun familiare registrato nel fascicolo</h4>
          <p className="muted">
            Aggiungi il tuo coniuge o i tuoi figli nella sezione "Famiglia" del menu per monitorare diritti, permessi retribuiti e congedo parentale a norma di legge.
          </p>
        </div>
      )}
    </div>
  );
}
