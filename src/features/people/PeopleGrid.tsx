import { Plus, Search, ArrowUpRight, UserRound } from 'lucide-react';
import { Venus, Mars } from './GenderIcons';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { getPersonCurrentProfile } from '../../shared/personUtils';
import { ProfileBadge3d } from '../../shared/icons3d';
import './peopleGrid.css';

export function PeopleGrid({
  people,
  search,
  onSearchChange,
  onSelect,
  onCreate,
}: {
  people: Person[];
  search: string;
  onSearchChange: (val: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const t = useT();

  const filtered = people.filter(p =>
    `${p.lastName} ${p.firstName}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase())
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('app')}</span>
          <h1>{t('welcome')}</h1>
          <p className="muted">{t('intro')}</p>
        </div>
        <button onClick={onCreate}>
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      <div className="collection-heading">
        <h2>
          {t('people')} <span className="count">{people.length}</span>
        </h2>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            aria-label={t('search')}
            placeholder={t('search')}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="person-grid">
        {filtered.map(p => {
          const profile = getPersonCurrentProfile(p);
          return (
            <button
              className="panel person-card"
              key={p.id}
              onClick={() => onSelect(p.id)}
            >
              <div className="card-top-row">
                <div className={`avatar ${p.gender}`}>
                  {p.gender === 'female' ? (
                    <Venus />
                  ) : p.gender === 'male' ? (
                    <Mars />
                  ) : (
                    <UserRound />
                  )}
                </div>
                {profile && profile.code !== '—' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ProfileBadge3d code={profile.code} size={28} />
                    <span
                      className="badge"
                      title={
                        profile.isDerived
                          ? t('profileDerived')
                          : undefined
                      }
                    >
                      {profile.code}
                    </span>
                  </div>
                ) : (
                  <span className="badge">{t('noServices')}</span>
                )}
              </div>
              <h2>
                {p.lastName} {p.firstName}
              </h2>
              <p>
                {p.records.length} {t('records')}
              </p>
              <div className="card-footer">
                {t('open')}
                <ArrowUpRight size={18} />
              </div>
            </button>
          );
        })}
        <button className="add-card" onClick={onCreate}>
          <span>
            <Plus size={24} />
          </span>
          <strong>{t('add')}</strong>
        </button>
      </div>

      {!people.length && (
        <div className="empty">
          <h3>{t('empty')}</h3>
          <p>{t('emptyHelp')}</p>
        </div>
      )}
    </>
  );
}
