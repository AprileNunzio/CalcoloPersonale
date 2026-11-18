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
          background: 'linear-gradient(135deg, #fbf7ff 0%, #f3e8ff 100%)',
          border: '1.5px solid #d8b4fe',
          borderRadius: 8,
          padding: showDetails ? '8px 12px' : '4px 10px',
          boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1)',
        }}
        title={status.shortDescription}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crown size={15} color="#7e22ce" />
          <strong style={{ color: '#581c87', fontSize: 12.5, fontWeight: 750 }}>
            {status.badgeTitle}
          </strong>
        </div>
        {showDetails && (
          <div style={{ fontSize: 11, color: '#6b21a8', lineHeight: 1.4 }}>
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
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '1.5px solid #6ee7b7',
          borderRadius: 8,
          padding: '4px 10px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
        }}
        title={status.shortDescription}
      >
        <Sparkles size={14} color="#047857" />
        <strong style={{ color: '#065f46', fontSize: 12, fontWeight: 750 }}>
          {status.badgeTitle}
        </strong>
        <span style={{ fontSize: 11, color: '#047857', fontWeight: 600 }}>
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
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        padding: '4px 10px',
      }}
      title={status.shortDescription}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Clock size={13} color="#475569" />
        <strong style={{ color: '#334155', fontSize: 12, fontWeight: 700 }}>
          {status.badgeTitle}
        </strong>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {status.totalStateAtaDays}/706 gg ({status.percentTo24Months}%)
        </span>
      </div>
      {showDetails && (
        <div style={{ width: '100%', background: '#e2e8f0', height: 4, borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${status.percentTo24Months}%`,
              background: '#0d9488',
              height: '100%',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}
    </div>
  );
}
