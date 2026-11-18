import { Crown, Sparkles, Clock, CheckCircle2, Award } from 'lucide-react';
import { Person } from '../../shared/types';
import { computeCareerStatus } from '../../shared/careerStatus';

interface CareerStatusBadgeProps {
  person: Person;
  showDetails?: boolean;
}

export function CareerStatusBadge({ person, showDetails = false }: CareerStatusBadgeProps) {
  const status = computeCareerStatus(person);

  if (status.isRuolo) {
    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: showDetails ? 'column' : 'row',
          alignItems: showDetails ? 'flex-start' : 'center',
          gap: 6,
          background: 'linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface-container) 100%)',
          border: '1.5px solid var(--outline-variant)',
          borderRadius: 8,
          padding: showDetails ? '8px 12px' : '4px 10px',
          boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1)',
        }}
        title={status.shortDescription}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crown size={15} color="var(--primary)" />
          <strong style={{ color: 'var(--primary)', fontSize: 12.5, fontWeight: 750 }}>
            {status.badgeTitle}
          </strong>
        </div>
        {showDetails && (
          <div style={{ fontSize: 11, color: 'var(--primary)', lineHeight: 1.4 }}>
            {status.activeRuoloDetails?.serviceSchoolName && (
              <div>Sede: {status.activeRuoloDetails.serviceSchoolName}</div>
            )}
            {typeof status.activeRuoloDetails?.continuityYears === 'number' &&
              status.activeRuoloDetails.continuityYears > 0 && (
                <div>Continuità: {status.activeRuoloDetails.continuityYears} anni</div>
              )}
          </div>
        )}
      </div>
    );
  }

  if (status.isPrimaFascia) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, var(--secondary-container) 0%, var(--secondary-container) 100%)',
          border: '1.5px solid var(--outline-variant)',
          borderRadius: 8,
          padding: '4px 10px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
        }}
        title={status.shortDescription}
      >
        <Sparkles size={14} color="var(--secondary)" />
        <strong style={{ color: 'var(--secondary)', fontSize: 12, fontWeight: 750 }}>
          {status.badgeTitle}
        </strong>
        <span style={{ fontSize: 11, color: 'var(--secondary)', fontWeight: 600 }}>
          ({status.totalStateAtaMonths} mesi)
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 3,
        background: 'var(--surface-container-high)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 8,
        padding: '4px 10px',
      }}
      title={status.shortDescription}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Clock size={13} color="var(--on-surface-variant)" />
        <strong style={{ color: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 700 }}>
          {status.badgeTitle}
        </strong>
        <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
          {status.totalStateAtaDays}/706 gg ({status.percentTo24Months}%)
        </span>
      </div>
      {showDetails && (
        <div style={{ width: '100%', background: 'var(--outline-variant)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${status.percentTo24Months}%`,
              background: 'var(--primary)',
              height: '100%',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}
    </div>
  );
}
