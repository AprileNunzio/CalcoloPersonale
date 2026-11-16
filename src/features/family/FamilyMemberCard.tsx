import {
  Heart,
  Baby,
  Users,
  UserCheck,
  User,
  Pencil,
  Trash2,
  Link2,
  ShieldAlert,
  Award,
  Calendar,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FamilyMemberData, FamilyRelation } from './types';
import { calculateAge } from './familyUtils';

function getRelationIcon(rel: FamilyRelation) {
  switch (rel) {
    case 'spouse':
      return <Heart size={16} color="#e11d48" />;
    case 'child':
      return <Baby size={16} color="#2563eb" />;
    case 'parent':
      return <Users size={16} color="#059669" />;
    case 'sibling':
      return <UserCheck size={16} color="#7c3aed" />;
    default:
      return <User size={16} color="#64748b" />;
  }
}

function getRelationBadgeClass(rel: FamilyRelation) {
  switch (rel) {
    case 'spouse':
      return 'rel-badge spouse';
    case 'child':
      return 'rel-badge child';
    case 'parent':
      return 'rel-badge parent';
    case 'sibling':
      return 'rel-badge sibling';
    default:
      return 'rel-badge other';
  }
}

export function FamilyMemberCard({
  member,
  allPeople,
  busy,
  onEdit,
  onDelete,
}: {
  member: FamilyMemberData;
  allPeople: Person[];
  busy: boolean;
  onEdit: (m: FamilyMemberData) => void;
  onDelete: (m: FamilyMemberData) => void;
}) {
  const t = useT();
  const age = calculateAge(member.birthDate);
  const linkedPerson = member.linkedPersonId
    ? allPeople.find(p => p.id === member.linkedPersonId)
    : null;

  const relationLabelKey =
    member.relation === 'spouse'
      ? 'relationSpouse'
      : member.relation === 'child'
      ? 'relationChild'
      : member.relation === 'parent'
      ? 'relationParent'
      : member.relation === 'sibling'
      ? 'relationSibling'
      : 'relationOther';

  return (
    <article className="family-member-card">
      <div className="family-card-main">
        <div className="family-card-header">
          <div className="family-title-row">
            <span className={getRelationBadgeClass(member.relation)}>
              {getRelationIcon(member.relation)}
              <span>{t(relationLabelKey)}</span>
            </span>

            <h3>{member.fullName}</h3>

            {age !== null && (
              <span className="age-pill">
                {age.years > 0
                  ? t('familyAgeYears').replace('{years}', String(age.years))
                  : t('familyAgeMonths').replace('{months}', String(age.months))}
              </span>
            )}
          </div>

          <div className="family-badges-strip">
            {member.dependentPercentage > 0 ? (
              <span className="info-chip dependent">
                <Percent size={12} />
                {member.dependentPercentage === 100 ? t('dependent100') : t('dependent50')}
              </span>
            ) : (
              <span className="info-chip non-dependent">{t('notDependent')}</span>
            )}

            {member.isDisability104 && (
              <span className="info-chip disability-104">
                <ShieldAlert size={12} />
                {t('law104AssistBadge')}
              </span>
            )}

            {linkedPerson && (
              <span className="info-chip linked">
                <Link2 size={12} />
                {t('linkedVaultProfile')}: {linkedPerson.lastName} {linkedPerson.firstName}
              </span>
            )}
          </div>
        </div>

        <div className="family-meta-grid">
          {member.birthDate && (
            <div className="meta-item">
              <Calendar size={13} />
              <span>{t('familyBornOn').replace('{date}', member.birthDate)}</span>
            </div>
          )}

          {member.fiscalCode && (
            <div className="meta-item">
              <CreditCard size={13} />
              <span className="code-text">{member.fiscalCode}</span>
            </div>
          )}
        </div>

        {member.notesText && (
          <p className="family-notes-text">{member.notesText}</p>
        )}

        <div className="family-benefits-row">
          {member.relation === 'child' && age && age.years < 3 && (
            <span className="benefit-pill">
              <Award size={11} />
              {t('schoolBenefitChildUnder3')}
            </span>
          )}

          {member.relation === 'child' && age && age.years < 12 && (
            <span className="benefit-pill">
              <Award size={11} />
              {t('schoolBenefitChildUnder12')}
            </span>
          )}

          {member.relation === 'child' && member.dependentPercentage > 0 && (
            <span className="benefit-pill highlight">
              <Award size={11} />
              {t('schoolBenefitDependent')}
            </span>
          )}

          {member.isDisability104 && (
            <span className="benefit-pill law104">
              <ShieldAlert size={11} />
              {t('law104BenefitsBadge')}
            </span>
          )}
        </div>
      </div>

      <div className="family-card-actions">
        <button
          type="button"
          className="icon secondary"
          title={t('edit')}
          disabled={busy}
          onClick={() => onEdit(member)}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="icon secondary danger"
          title={t('remove')}
          disabled={busy}
          onClick={() => onDelete(member)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
