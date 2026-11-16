import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  FolderHeart,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Users,
  UserRound,
  Languages,
  RefreshCw,
  FileText,
  Bot,
} from 'lucide-react';
import { Venus, Mars } from '../people/GenderIcons';
import { Archive, Analysis, Person } from '../../shared/types';
import { Locale, LocaleContext, useT } from '../../shared/i18n';
import { AutoSaveContext, AutoSaveStatus } from '../autosave/AutoSave';
import { UpdatesBoundary, requestUpdate } from '../updates/UpdatesBoundary';
import { useCloseGuard } from '../autosave/useCloseGuard';
import { flush } from '../autosave/store';
import { call, getRevision } from '../../shared/api';
import { PersonForm } from '../people/PersonForm';
import { Records } from '../records/Records';
import { AiAssistantPage } from '../ai/AiAssistantPage';
import { Dashboard } from '../dashboard/Dashboard';
import { Applications } from '../applications/Applications';
import { getPersonCurrentProfile } from '../../shared/personUtils';
import { ProfileBadge3d } from '../../shared/icons3d';
import { OtaBanner } from '../ota/OtaBanner';
import { VaultScreen } from './VaultScreen';
import { UpdatesPage } from '../updates/UpdatesPage';

export default function App() {
  const [locale, setLocale] = useState<Locale>('it');
  return (
    <LocaleContext.Provider value={locale}>
      <UpdatesBoundary>
        <Workspace locale={locale} setLocale={setLocale} />
        <OtaBanner />
      </UpdatesBoundary>
    </LocaleContext.Provider>
  );
}

function Workspace({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  useCloseGuard();
  const t = useT();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [section, setSection] = useState('overview');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Analysis | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear() - (now.getMonth() < 8 ? 1 : 0));

  const person = archive?.people.find(p => p.id === selected);

  const execute = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'error');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setData(null);
    if (selected && archive) {
      call<Analysis>('analyze', { id: selected, year })
        .then(a => {
          if (active) setData(a);
        })
        .catch(e => {
          if (active) setError(typeof e === 'string' ? e : 'error');
        });
    }
    return () => {
      active = false;
    };
  }, [selected, archive, year]);

  const lock = useCallback(
    () =>
      execute(async () => {
        await flush();
        await call('lock');
        setArchive(null);
        setSelected(null);
        setData(null);
        setCreating(false);
        setSearch('');
        setNotice('');
      }),
    [execute],
  );

  useEffect(() => {
    if (!archive) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void lock(), 300000);
    };
    reset();
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [archive, lock]);

  const save = (p: Person) =>
    void execute(async () => {
      await flush();
      const next = await call<Archive>('save_person', {
        person: p,
        revision: getRevision(),
      });
      setArchive(next);
      setSelected(p.id);
      setCreating(false);
    });

  const language = (
    <button
      className="secondary language"
      aria-label={t('language')}
      onClick={() => {
        const next = locale === 'it' ? 'en' : 'it';
        setLocale(next);
        document.documentElement.lang = next;
      }}
    >
      <Languages size={17} />
      {locale.toUpperCase()}
    </button>
  );

  const banner = (
    <>
      {error && (
        <div role="alert" className="error">
          {t(error)}
        </div>
      )}
      {notice && (
        <div role="status" className="notice">
          {t(notice)}
        </div>
      )}
    </>
  );

  if (!archive) {
    return (
      <VaultScreen
        locale={locale}
        setLocale={setLocale}
        onUnlock={pwd =>
          void execute(async () => {
            const result = await call<Archive>('unlock', { password: pwd });
            setArchive(result);
          })
        }
        busy={busy}
        error={error}
        notice={notice}
      />
    );
  }

  const currentProfile = person ? getPersonCurrentProfile(person) : null;

  return (
    <AutoSaveContext.Provider value={{ archive, saved: setArchive }}>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              <BriefcaseBusiness />
            </div>
            <strong>{t('app')}</strong>
          </div>
          <div className="side-label">{t('all')}</div>
          <button
            className={!person ? 'nav active' : 'nav'}
            onClick={() => {
              setSelected(null);
              setCreating(false);
              setSection('overview');
            }}
          >
            <Users size={19} />
            {t('people')}
            <span>{archive.people.length}</span>
          </button>
          {person && (
            <>
              <div className="side-label">
                {person.firstName} {person.lastName}
              </div>
              {[
                { k: 'overview', icon: LayoutDashboard },
                { k: 'identity', icon: FolderHeart },
                { k: 'applications', icon: FileText },
                { k: 'service', icon: FolderHeart },
                { k: 'qualification', icon: FolderHeart },
                { k: 'child', icon: FolderHeart },
                { k: 'absences', icon: FolderHeart },
              ].map(({ k, icon: Icon }) => (
                <button
                  className={`nav ${section === k ? 'active' : ''}`}
                  key={k}
                  onClick={() => setSection(k)}
                >
                  <Icon size={18} /> {t(k)}
                </button>
              ))}
            </>
          )}
          <div className="sidebar-bottom">
            <button
              className={`nav ${section === 'assistant' ? 'active' : ''}`}
              onClick={() => {
                setSelected(null);
                setCreating(false);
                setSection('assistant');
              }}
            >
              <Bot size={17} />
              {t('assistant')}
            </button>
            <div className="secure-label">
              <ShieldCheck size={18} />
              <div>
                {t('secure')}
                <small>{t('local')}</small>
              </div>
            </div>
            <button
              className={`nav ${section === 'updates' ? 'active' : ''}`}
              onClick={() => {
                setSelected(null);
                setCreating(false);
                setSection('updates');
              }}
            >
              <RefreshCw size={17} />
              {t('update')}
            </button>
            <button className="nav" disabled={busy} onClick={() => void lock()}>
              <LockKeyhole size={17} />
              {t('lock')}
            </button>
          </div>
        </aside>

        <div className="workspace">
          <header>
            <AutoSaveStatus />
            <span>{section === 'updates' ? t('systemUpdates') : t(person ? section : 'people')}</span>
            <div>
              {busy && <span role="status">{t('loading')}</span>}
              {language}
              <span className="user-mark">CP</span>
            </div>
          </header>

          <main className="content">
            {banner}
            {section === 'assistant' ? (
              <AiAssistantPage />
            ) : section === 'updates' ? (
              <UpdatesPage />
            ) : creating ? (
              <PersonForm busy={busy} onSave={save} onCancel={() => setCreating(false)} />
            ) : person ? (
              <>
                <div className="person-compact-bar">
                  <button className="back-btn-compact" onClick={() => setSelected(null)} title={t('back')}>
                    <ArrowLeft size={16} />
                    <span>{t('back')}</span>
                  </button>
                  <div className={`avatar-compact ${person.gender}`}>
                    {person.gender === 'female' ? (
                      <Venus />
                    ) : person.gender === 'male' ? (
                      <Mars />
                    ) : (
                      <UserRound />
                    )}
                  </div>
                  <div className="person-compact-info">
                    <h2>
                      {person.lastName} {person.firstName}
                    </h2>
                    {currentProfile && currentProfile.code !== '—' ? (
                      <div className="person-profile-badge-row">
                        <ProfileBadge3d code={currentProfile.code} size={24} />
                        <span className="badge" title={currentProfile.isDerived ? t('profileDerived') : undefined}>
                          {currentProfile.code} · {currentProfile.label}
                        </span>
                      </div>
                    ) : (
                      <span className="badge">{t('noServices')}</span>
                    )}
                  </div>
                </div>

                {section === 'overview' ? (
                  <Dashboard person={person} data={data} year={year} setYear={setYear} />
                ) : section === 'identity' ? (
                  <>
                    <PersonForm
                      key={person.id}
                      person={person}
                      busy={busy}
                      onSave={save}
                      onCancel={() => setSection('overview')}
                    />
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t('confirmDelete'))) {
                          void execute(async () => {
                            await flush();
                            setArchive(
                              await call<Archive>('delete_person', {
                                id: person.id,
                                revision: getRevision(),
                              }),
                            );
                            setSelected(null);
                          });
                        }
                      }}
                    >
                      {t('remove')}
                    </button>
                  </>
                ) : section === 'applications' ? (
                  <Applications
                    key={`${person.id}-applications`}
                    person={person}
                    save={save}
                    busy={busy}
                  />
                ) : (
                  <Records
                    key={`${person.id}-${section}`}
                    person={person}
                    section={section}
                    save={save}
                    busy={busy}
                  />
                )}
              </>
            ) : (
              <>
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">{t('app')}</span>
                    <h1>{t('welcome')}</h1>
                    <p className="muted">{t('intro')}</p>
                  </div>
                  <button onClick={() => setCreating(true)}>
                    <Plus size={18} />
                    {t('add')}
                  </button>
                </div>

                <div className="collection-heading">
                  <h2>
                    {t('people')} <span className="count">{archive.people.length}</span>
                  </h2>
                  <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      aria-label={t('search')}
                      placeholder={t('search')}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="person-grid">
                  {archive.people
                    .filter(p =>
                      `${p.lastName} ${p.firstName}`
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase()),
                    )
                    .map(p => {
                      const prof = getPersonCurrentProfile(p);
                      return (
                        <button
                          className="person-card"
                          key={p.id}
                          onClick={() => {
                            setSelected(p.id);
                            setSection('overview');
                          }}
                        >
                          <div className="card-top">
                            <div className={`avatar ${p.gender}`}>
                              {p.gender === 'female' ? (
                                <Venus />
                              ) : p.gender === 'male' ? (
                                <Mars />
                              ) : (
                                <UserRound />
                              )}
                            </div>
                            {prof.code !== '—' && <ProfileBadge3d code={prof.code} size={34} />}
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
                  <button className="add-card" onClick={() => setCreating(true)}>
                    <span>
                      <Plus size={24} />
                    </span>
                    <strong>{t('add')}</strong>
                  </button>
                </div>

                {!archive.people.length && (
                  <div className="empty">
                    <h3>{t('empty')}</h3>
                    <p>{t('emptyHelp')}</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </AutoSaveContext.Provider>
  );
}
