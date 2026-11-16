import { useState, useContext, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Heart,
  Baby,
  ShieldAlert,
  Award,
  AlertCircle,
} from 'lucide-react';
import { Person, Archive } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { useT } from '../../shared/i18n';
import { AutoSaveContext } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { FamilyMemberData } from './types';
import {
  parseFamilyMember,
  serializeFamilyMember,
  calculateFamilyStatistics,
} from './familyUtils';
import { FamilyMemberCard } from './FamilyMemberCard';
import { FamilyRightsPanel } from './FamilyRightsPanel';
import { FamilyFormModal } from './FamilyFormModal';
import './family.css';

export function FamilyPage({
  person,
  allPeople,
  busy,
}: {
  person: Person;
  allPeople: Person[];
  busy: boolean;
}) {
  const t = useT();
  const context = useContext(AutoSaveContext)!;

  const [editingMember, setEditingMember] = useState<FamilyMemberData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const members: FamilyMemberData[] = useMemo(() => {
    return (person.records || [])
      .filter(r => r.kind === 'child')
      .map(parseFamilyMember);
  }, [person.records]);

  const stats = useMemo(() => calculateFamilyStatistics(members), [members]);

  const handleSaveMember = async (data: Partial<FamilyMemberData>) => {
    if (!data.fullName || !data.birthDate || !data.relation) return;

    setPending(true);
    setError('');
    try {
      await flush();
      const entry = serializeFamilyMember({
        id: data.id,
        relation: data.relation,
        fullName: data.fullName,
        birthDate: data.birthDate,
        fiscalCode: data.fiscalCode,
        dependentPercentage: data.dependentPercentage ?? 100,
        isDisability104: data.isDisability104 ?? false,
        linkedPersonId: data.linkedPersonId,
        notesText: data.notesText,
      });

      const updatedArchive = await call<Archive>('save_record', {
        personId: person.id,
        entryId: entry.id,
        entry,
        revision: getRevision(),
      });

      context.saved(updatedArchive);
      setEditingMember(null);
      setIsCreating(false);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'error');
    } finally {
      setPending(false);
    }
  };

  const handleDeleteMember = async (member: FamilyMemberData) => {
    if (!window.confirm(t('deleteFamilyMemberConfirm'))) return;

    setPending(true);
    setError('');
    try {
      await flush();
      const updatedArchive = await call<Archive>('delete_record', {
        personId: person.id,
        entryId: member.id,
        revision: getRevision(),
      });

      context.saved(updatedArchive);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'error');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="family-page-container">
      <div className="family-page-header">
        <div>
          <h2>{t('familyTitle')}</h2>
          <p className="family-page-subtitle">{t('familySubtitle')}</p>
        </div>

        <button
          type="button"
          disabled={busy || pending || isCreating || editingMember !== null}
          onClick={() => setIsCreating(true)}
        >
          <UserPlus size={17} />
          {t('addFamilyMember')}
        </button>
      </div>

      {error && (
        <div className="family-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{t(error)}</span>
        </div>
      )}

      <div className="family-kpi-grid">
        <div className="family-kpi-card">
          <div className="kpi-icon-wrap blue">
            <Users size={18} />
          </div>
          <div>
            <div className="kpi-num">{stats.totalMembers}</div>
            <div className="kpi-label">{t('totalFamilyMembers')}</div>
          </div>
        </div>

        <div className="family-kpi-card">
          <div className="kpi-icon-wrap green">
            <Baby size={18} />
          </div>
          <div>
            <div className="kpi-num">{stats.dependentChildrenCount}</div>
            <div className="kpi-label">{t('dependentChildrenCount')}</div>
          </div>
        </div>

        <div className="family-kpi-card">
          <div className="kpi-icon-wrap rose">
            <Heart size={18} />
          </div>
          <div>
            <div className="kpi-num">{stats.spouseCount}</div>
            <div className="kpi-label">{t('spouseRegistered')}</div>
          </div>
        </div>

        <div className="family-kpi-card">
          <div className="kpi-icon-wrap amber">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="kpi-num">{stats.disability104Count}</div>
            <div className="kpi-label">{t('disability104Count')}</div>
          </div>
        </div>
      </div>

      {stats.hasAtaPreference && (
        <div className="ata-preference-banner">
          <Award size={18} />
          <div>
            <strong>{t('ataPreferenceNotice')}</strong>
            <small>
              Valida ai fini delle graduatorie ATA di terza fascia e permanenti 24 mesi a parità di punteggio.
            </small>
          </div>
        </div>
      )}

      <div className="family-members-section">
        {members.length === 0 ? (
          <div className="empty-family-placeholder">
            <div className="empty-icon-circle">
              <Users size={28} />
            </div>
            <h4>{t('noFamilyMembersYet')}</h4>
            <p>{t('noFamilyMembersPrompt')}</p>
            <button
              type="button"
              className="primary"
              onClick={() => setIsCreating(true)}
              disabled={busy || pending}
            >
              <UserPlus size={16} />
              {t('addFamilyMember')}
            </button>
          </div>
        ) : (
          <div className="family-cards-list">
            {members.map(member => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                allPeople={allPeople}
                busy={busy || pending}
                onEdit={m => setEditingMember(m)}
                onDelete={m => void handleDeleteMember(m)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="family-rights-section">
        <FamilyRightsPanel person={person} allPeople={allPeople} />
      </div>

      {(isCreating || editingMember) && (
        <FamilyFormModal
          member={editingMember}
          allPeople={allPeople}
          currentPersonId={person.id}
          busy={busy || pending}
          onSave={data => void handleSaveMember(data)}
          onCancel={() => {
            setIsCreating(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}
