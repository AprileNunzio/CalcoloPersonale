import { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Percent,
  Calendar,
  CreditCard,
  Heart,
  Baby,
  UserCheck,
  User,
  Check,
  X,
  Search,
  Link2,
} from 'lucide-react';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FamilyMemberData, FamilyRelation } from './types';
import { calculateAge } from './familyUtils';
import './familyModal.css';

export function FamilyFormModal({
  member,
  allPeople,
  currentPersonId,
  busy,
  onSave,
  onCancel,
}: {
  member?: FamilyMemberData | null;
  allPeople: Person[];
  currentPersonId: string;
  busy: boolean;
  onSave: (data: Partial<FamilyMemberData>) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const otherPeople = allPeople.filter(p => p.id !== currentPersonId);

  const [source, setSource] = useState<'manual' | 'archive'>(
    member?.linkedPersonId ? 'archive' : 'manual'
  );
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    member?.linkedPersonId || ''
  );
  const [relation, setRelation] = useState<FamilyRelation>(
    member?.relation || 'child'
  );
  const [fullName, setFullName] = useState(member?.fullName || '');
  const [birthDate, setBirthDate] = useState(member?.birthDate || '');
  const [fiscalCode, setFiscalCode] = useState(member?.fiscalCode || '');
  const [dependentPercentage, setDependentPercentage] = useState<number>(
    member?.dependentPercentage ?? 100
  );
  const [isDisability104, setIsDisability104] = useState<boolean>(
    member?.isDisability104 ?? false
  );
  const [notesText, setNotesText] = useState(member?.notesText || '');
  const [searchTerm, setSearchTerm] = useState('');

  const liveAge = calculateAge(birthDate);

  const filteredPeople = otherPeople.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      `${p.lastName} ${p.firstName}`.toLowerCase().includes(q) ||
      (p.fiscalCode && p.fiscalCode.toLowerCase().includes(q))
    );
  });

  const handlePickArchivePerson = (chosen: Person) => {
    setSelectedPersonId(chosen.id);
    setFullName(`${chosen.lastName} ${chosen.firstName}`);
    if (chosen.birthDate) setBirthDate(chosen.birthDate);
    if (chosen.fiscalCode) setFiscalCode(chosen.fiscalCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !birthDate) return;

    onSave({
      id: member?.id,
      relation,
      fullName: fullName.trim(),
      birthDate,
      fiscalCode: fiscalCode.trim().toUpperCase(),
      dependentPercentage,
      isDisability104,
      linkedPersonId: source === 'archive' && selectedPersonId ? selectedPersonId : undefined,
      notesText: notesText.trim(),
    });
  };

  return (
    <div className="family-modal-overlay">
      <div className="family-modal-dialog">
        <div className="family-modal-header">
          <h3>{member ? t('editFamilyMember') : t('addFamilyMember')}</h3>
          <button type="button" className="icon secondary" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="family-modal-form">
          <div className="family-source-switch">
            <button
              type="button"
              className={source === 'archive' ? 'active' : ''}
              onClick={() => setSource('archive')}
            >
              <Users size={15} />
              {t('chooseFromArchive')}
            </button>
            <button
              type="button"
              className={source === 'manual' ? 'active' : ''}
              onClick={() => {
                setSource('manual');
                setSelectedPersonId('');
              }}
            >
              <UserPlus size={15} />
              {t('manualEntry')}
            </button>
          </div>

          {source === 'archive' && (
            <div className="archive-picker-box">
              {selectedPersonId ? (
                <div className="selected-archive-person">
                  <div className="person-avatar-circle">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <strong>{fullName}</strong>
                    <small>{fiscalCode ? `${fiscalCode} · ` : ''}{birthDate}</small>
                  </div>
                  <button
                    type="button"
                    className="mini-btn secondary"
                    onClick={() => setSelectedPersonId('')}
                  >
                    {t('change')}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="archive-search-wrap">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder={t('searchPersonPlaceholder')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="archive-results-scroll">
                    {filteredPeople.length === 0 ? (
                      <p className="empty-results">{t('noResults')}</p>
                    ) : (
                      filteredPeople.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="archive-person-row"
                          onClick={() => handlePickArchivePerson(p)}
                        >
                          <div>
                            <strong>{p.lastName} {p.firstName}</strong>
                            <small>{p.fiscalCode || ''} {p.birthDate ? `· ${p.birthDate}` : ''}</small>
                          </div>
                          <Check size={14} opacity={0.3} />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            <label>{t('relation')}</label>
            <div className="relation-chips">
              {(
                [
                  { key: 'child', icon: Baby, label: 'relationChild' },
                  { key: 'spouse', icon: Heart, label: 'relationSpouse' },
                  { key: 'parent', icon: Users, label: 'relationParent' },
                  { key: 'sibling', icon: UserCheck, label: 'relationSibling' },
                  { key: 'other', icon: User, label: 'relationOther' },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`relation-chip ${relation === key ? 'active' : ''}`}
                  onClick={() => setRelation(key)}
                >
                  <Icon size={14} />
                  <span>{t(label)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label>{t('fullName')}</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t('familyFullNamePlaceholder')}
              />
            </div>

            <div className="form-field-group">
              <label>{t('fiscalCodeLabel')}</label>
              <input
                type="text"
                maxLength={16}
                value={fiscalCode}
                onChange={e => setFiscalCode(e.target.value.toUpperCase())}
                placeholder={t('fiscalCodePlaceholder')}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label>
                {t('birthDate')}
                {liveAge && (
                  <span className="live-age-text">
                    ({liveAge.years > 0 ? `${liveAge.years} anni` : `${liveAge.months} mesi`})
                  </span>
                )}
              </label>
              <input
                required
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </div>

            <div className="form-field-group">
              <label>{t('dependentPercentage')}</label>
              <div className="dependent-chips">
                {[100, 50, 0].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    className={`dep-chip ${dependentPercentage === pct ? 'active' : ''}`}
                    onClick={() => setDependentPercentage(pct)}
                  >
                    <Percent size={12} />
                    {pct === 100 ? t('dependent100') : pct === 50 ? t('dependent50') : t('notDependent')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="law104-toggle-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isDisability104}
                onChange={e => setIsDisability104(e.target.checked)}
              />
              <div>
                <strong>{t('law104Checkbox')}</strong>
                <small>{t('law104BenefitsBadge')}</small>
              </div>
            </label>
          </div>

          <div className="form-field-group">
            <label>{t('notes')}</label>
            <input
              type="text"
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              placeholder={t('familyNotesPlaceholder')}
            />
          </div>

          <div className="family-modal-actions">
            <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
              {t('closeForm')}
            </button>
            <button type="submit" disabled={busy || !fullName.trim() || !birthDate}>
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
