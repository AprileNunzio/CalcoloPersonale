import { useState, useMemo } from 'react';
import { Users, UserPlus, Search, Check, Link2 } from 'lucide-react';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';

export function FamilyMemberPicker({
  otherPeople,
  selectedPersonId,
  onSelect,
  source,
  onSourceChange,
}: {
  otherPeople: Person[];
  selectedPersonId: string;
  onSelect: (person: Person | null) => void;
  source: 'manual' | 'archive';
  onSourceChange: (source: 'manual' | 'archive') => void;
}) {
  const t = useT();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPeople = useMemo(() => {
    if (!searchTerm.trim()) return otherPeople;
    const q = searchTerm.toLowerCase().trim();
    return otherPeople.filter(p =>
      `${p.lastName} ${p.firstName}`.toLowerCase().includes(q) ||
      (p.fiscalCode && p.fiscalCode.toLowerCase().includes(q))
    );
  }, [otherPeople, searchTerm]);

  const selectedPerson = otherPeople.find(p => p.id === selectedPersonId);

  return (
    <div className="family-member-picker" style={{ marginBottom: 18 }}>
      <label className="field-label-text">{t('familyMemberSource')}</label>
      <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 12 }}>
        <button
          type="button"
          className={source === 'archive' ? '' : 'secondary'}
          onClick={() => onSourceChange('archive')}
        >
          <Users size={16} />
          {t('chooseFromArchive')}
        </button>
        <button
          type="button"
          className={source === 'manual' ? '' : 'secondary'}
          onClick={() => {
            onSourceChange('manual');
            onSelect(null);
          }}
        >
          <UserPlus size={16} />
          {t('manualEntry')}
        </button>
      </div>

      {source === 'archive' && (
        <div className="archive-search-container" style={{
          background: 'var(--color-bg-secondary, #f8fafc)',
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid var(--color-border, #e2e8f0)',
        }}>
          {selectedPerson ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light, #eff6ff)',
                  color: 'var(--color-primary, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  <Link2 size={18} />
                </div>
                <div>
                  <strong>{selectedPerson.lastName} {selectedPerson.firstName}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                    {selectedPerson.fiscalCode ? `${selectedPerson.fiscalCode} · ` : ''}
                    {selectedPerson.birthDate ? `${t('birthDate')}: ${selectedPerson.birthDate}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={() => onSelect(null)}
              >
                {t('edit')}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted, #94a3b8)',
                }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t('searchPersonPlaceholder')}
                  style={{ paddingLeft: 34, width: '100%' }}
                />
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredPeople.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #94a3b8)', margin: '8px 4px' }}>
                    {t('noResults')}
                  </p>
                ) : (
                  filteredPeople.map(person => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onSelect(person)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid transparent',
                        background: 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: 'inherit',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover, #f1f5f9)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {person.lastName} {person.firstName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>
                          {person.fiscalCode || ''} {person.birthDate ? `· ${person.birthDate}` : ''}
                        </div>
                      </div>
                      <Check size={14} style={{ opacity: 0.3 }} />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
