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
import './familyCard.css';

function getRelationIcon(rel: FamilyRelation) {
  switch (rel) {
    case 'spouse':
      return <Heart size={16} color="var(--primary)" />;
    case 'child':
      return <Baby size={16} color="var(--primary)" />;
    case 'parent':
      return <Users size={16} color="var(--secondary)" />;
    case 'sibling':
      return <UserCheck size={16} color="var(--primary)" />;
    default:
      return <User size={16} color="var(--on-surface-variant)" />;
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
      <div className="family-card-top-bar">
        <div className="family-identity-group">
          <div className={`family-avatar-wrap ${member.relation}`}>
            {getRelationIcon(member.relation)}
          </div>
          <div className="family-identity-text">
            <div className="family-identity-tags">
              <span className={getRelationBadgeClass(member.relation)}>
                {t(relationLabelKey)}
              </span>
              {age !== null && (
                <span className="age-pill">
                  {age.years > 0
                    ? t('familyAgeYears').replace('{years}', String(age.years))
                    : t('familyAgeMonths').replace('{months}', String(age.months))}
                </span>
              )}
            </div>
            <h3 className="family-member-name">{member.fullName}</h3>
          </div>
        </div>

        <div className="family-card-actions">
          <button
            type="button"
            className="card-action-btn"
            title={t('edit')}
            disabled={busy}
            onClick={() => onEdit(member)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="card-action-btn danger"
            title={t('remove')}
            disabled={busy}
            onClick={() => onDelete(member)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="family-card-tiles-grid">
        <div className="family-info-tile">
          <div className="tile-label">
            <Calendar size={12} />
            <span>Nascita & Anagrafica</span>
          </div>
          <div className="tile-value">
            {member.birthDate ? (
              <span>{t('familyBornOn').replace('{date}', member.birthDate)}</span>
            ) : (
              <span className="tile-muted">Data non indicata</span>
            )}
          </div>
          <div className="tile-sub">
            {member.fiscalCode ? (
              <span className="code-text"><CreditCard size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{member.fiscalCode}</span>
            ) : (
              <span className="tile-muted">CF non registrato</span>
            )}
          </div>
        </div>

        <div className="family-info-tile">
          <div className="tile-label">
            <Percent size={12} />
            <span>Fiscale & Carichi Famiglia</span>
          </div>
          <div className="tile-value">
            {member.dependentPercentage > 0 ? (
              <span className="info-chip dependent">
                <Percent size={11} />
                {member.dependentPercentage === 100 ? t('dependent100') : t('dependent50')}
              </span>
            ) : (
              <span className="info-chip non-dependent">{t('notDependent')}</span>
            )}
          </div>
          <div className="tile-sub">
            {member.isDisability104 ? (
              <span className="info-chip disability-104">
                <ShieldAlert size={11} />
                {t('law104AssistBadge')}
              </span>
            ) : (
              <span className="tile-muted">Nessuna legge 104 applicata</span>
            )}
          </div>
        </div>

        <div className="family-info-tile">
          <div className="tile-label">
            <Link2 size={12} />
            <span>Fascicolo & Precedenze</span>
          </div>
          <div className="tile-value">
            {linkedPerson ? (
              <span className="info-chip linked">
                <Link2 size={11} />
                {t('linkedVaultProfile')}: {linkedPerson.lastName} {linkedPerson.firstName}
              </span>
            ) : (
              <span className="tile-muted">Profilo autonomo</span>
            )}
          </div>
          <div className="tile-sub">
            {member.relation === 'child' && age && age.years < 12 ? (
              <span className="benefit-pill highlight">
                <Award size={11} /> Diritto Congedi Attivo
              </span>
            ) : (
              <span className="tile-muted">Nessun vincolo congedo</span>
            )}
          </div>
        </div>
      </div>

      {(member.isDisability104 || (member.relation === 'child' && (age?.years ?? 99) < 12)) && (
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
      )}

      {member.notesText && (
        <div className="family-notes-box">
          <strong>Note:</strong> {member.notesText}
        </div>
      )}
    </article>
  );
}
