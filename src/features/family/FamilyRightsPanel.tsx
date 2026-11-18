import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Baby,
  ShieldCheck,
  Award,
  DollarSign,
  Info,
} from 'lucide-react';
import { useT } from '../../shared/i18n';
import { Person } from '../../shared/types';
import { computeSharedFamilyLeave, SharedLeaveResult } from '../../shared/familyLeave';

export function FamilyRightsPanel({
  person,
  allPeople,
}: {
  person: Person;
  allPeople: Person[];
}) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(true);
  const sharedLeaves: SharedLeaveResult[] = computeSharedFamilyLeave(person, allPeople);

  return (
    <div className="family-rights-panel">
      <button
        type="button"
        className="family-rights-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="rights-title-group">
          <BookOpen size={18} />
          <strong>{t('normativeGuideTitle')}</strong>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="family-rights-content">
          {sharedLeaves.length > 0 ? (
            <div className="shared-leave-card-strip">
              {sharedLeaves.map(sl => (
                <div key={sl.childName} className="shared-leave-box">
                  <div className="shared-leave-header">
                    <Baby size={16} />
                    <strong>{sl.childName}</strong>
                    {sl.fatherBonusApplied && (
                      <span className="bonus-tag">+30gg Bonus Papà applicato</span>
                    )}
                  </div>
                  <div className="shared-leave-bar-wrap">
                    <div
                      className="shared-leave-bar-fill"
                      style={{
                        width: `${Math.min(100, (sl.totalUsedDays / sl.maxSharedDays) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="shared-leave-stats">
                    <small>
                      {sl.totalUsedDays} / {sl.maxSharedDays} giorni fruiti
                    </small>
                    <strong>{sl.remainingDays} giorni residui</strong>
                  </div>
                  {sl.hasOtherParent && (
                    <small className="other-parent-text">
                      Sincronizzato con {sl.otherParentName} ({sl.parentBDays} gg fruiti)
                    </small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '12px 14px', background: 'var(--surface-container-high)', borderRadius: 8, border: '1px solid var(--outline-variant)', fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              <strong>Nessun congedo parentale attivo:</strong> Ai sensi del D.Lgs. 151/2001 e del D.Lgs. 105/2022, il congedo parentale spetta esclusivamente in presenza di figli fino al compimento del 12° anno di vita.
            </div>
          )}

          <div className="rights-grid">
            <div className="right-item-card">
              <div className="right-item-head">
                <div className="right-item-icon-box primary">
                  <HeartHandshake size={16} />
                </div>
                <h4>{t('sharedParentalLeaveTitle')}</h4>
              </div>
              <p>{t('sharedParentalLeaveDesc')}</p>
            </div>

            <div className="right-item-card">
              <div className="right-item-head">
                <div className="right-item-icon-box secondary">
                  <Baby size={16} />
                </div>
                <h4>{t('childSicknessTitle')}</h4>
              </div>
              <p>{t('childSicknessDesc')}</p>
            </div>

            <div className="right-item-card">
              <div className="right-item-head">
                <div className="right-item-icon-box error">
                  <ShieldCheck size={16} />
                </div>
                <h4>{t('law104FamilyRightsTitle')}</h4>
              </div>
              <p>{t('law104FamilyRightsDesc')}</p>
            </div>

            <div className="right-item-card">
              <div className="right-item-head">
                <div className="right-item-icon-box tertiary">
                  <Award size={16} />
                </div>
                <h4>{t('ataPreferencesTitle')}</h4>
              </div>
              <p>{t('ataPreferencesDesc')}</p>
            </div>

            <div className="right-item-card wide">
              <div className="right-item-head">
                <div className="right-item-icon-box primary">
                  <DollarSign size={16} />
                </div>
                <h4>{t('auuTitle')}</h4>
              </div>
              <p>{t('auuDesc')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
