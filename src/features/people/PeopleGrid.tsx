import { Plus, Search, ArrowUpRight, UserRound, Sparkles } from 'lucide-react';
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
  onStartWizard,
}: {
  people: Person[];
  search: string;
  onSearchChange: (val: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onStartWizard: () => void;
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="wizard-btn-primary" onClick={onStartWizard}>
            <Sparkles size={17} />
            <span>Configurazione a Step</span>
          </button>
          <button className="secondary" onClick={onCreate}>
            <Plus size={18} />
            {t('add')}
          </button>
        </div>
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
        <div className="panel" style={{ textAlign: 'center', padding: '44px 24px', border: '2px dashed #b8d5cc', borderRadius: 20, marginTop: 24, background: '#fafdfc' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#e6f4f1', color: '#116b62', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(17, 107, 98, 0.12)' }}>
            <Sparkles size={32} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8, color: '#142e28' }}>Nessun fascicolo presente in archivio</h3>
          <p className="muted" style={{ maxWidth: 560, margin: '0 auto 22px', lineHeight: 1.6, fontSize: 14 }}>
            Inizia subito con la <strong>Configurazione Guidata a Step</strong>: ti aiuteremo passo dopo passo nella compilazione di anagrafica, titolo di studio d’accesso, certificazioni informatiche CIAD e servizi scolastici con spiegazioni dettagliate dalla A alla Z!
          </p>
          <button className="wizard-btn-primary" onClick={onStartWizard} style={{ padding: '12px 26px', fontSize: 15 }}>
            <Sparkles size={18} />
            <span>Avvia Prima Configurazione a Step</span>
          </button>
        </div>
      )}
    </>
  );
}
