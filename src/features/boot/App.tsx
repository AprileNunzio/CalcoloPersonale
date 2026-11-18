import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  FolderHeart,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  Users,
  UserRound,
  RefreshCw,
  FileText,
  Bot,
  Sparkles,
  Banknote,
  School,
  FileCheck,
} from 'lucide-react';
import { Venus, Mars } from '../people/GenderIcons';
import { Archive, Analysis, Person } from '../../shared/types';
import { Locale, LocaleContext, useT } from '../../shared/i18n';
import { AutoSaveContext, AutoSaveStatus } from '../autosave/AutoSave';
import { UpdatesBoundary } from '../updates/UpdatesBoundary';
import { useCloseGuard } from '../autosave/useCloseGuard';
import { flush } from '../autosave/store';
import { call, getRevision } from '../../shared/api';
import { PersonForm } from '../people/PersonForm';
import { PeopleGrid } from '../people/PeopleGrid';
import { Records } from '../records/Records';
import { AiAssistantPage } from '../ai/AiAssistantPage';
import { FloatingAssistant } from '../ai/FloatingAssistant';
import { Dashboard } from '../dashboard/Dashboard';
import { Applications } from '../applications/Applications';
import { FamilyPage } from '../family/FamilyPage';
import { SalarySimulatorPane } from '../salary/SalarySimulatorPane';
import { StrategicSchoolsPane } from '../schools30/StrategicSchoolsPane';
import { DossierExportPane } from '../dossier/DossierExportPane';
import { getPersonCurrentProfile } from '../../shared/personUtils';
import { ProfileBadge3d } from '../../shared/icons3d';
import { OtaBanner } from '../ota/OtaBanner';
import { VaultScreen } from './VaultScreen';
import { UpdatesPage } from '../updates/UpdatesPage';
import { FirstSetupWizard } from '../wizard/FirstSetupWizard';
import { SidebarNav } from './SidebarNav';

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
  const [showWizard, setShowWizard] = useState(false);
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
    call<Archive>('save_draft', { key: 'assistant', value: null })
      .then(res => {
        if (active && res && res.people) {
          setArchive(res);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
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
            try {
              const result = await call<Archive>('unlock', { password: pwd });
              setArchive(result);
            } catch (err) {
              if (err === 'conflict') {
                await call('lock').catch(() => {});
                const result = await call<Archive>('unlock', { password: pwd });
                setArchive(result);
                return;
              }
              throw err;
            }
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
        <SidebarNav
          archive={archive}
          person={person}
          section={section}
          busy={busy}
          onSelectPerson={id => {
            setSelected(id);
            setCreating(false);
          }}
          onSelectSection={s => setSection(s)}
          onOpenWizard={() => setShowWizard(true)}
          onLock={() => void lock()}
        />

        <div className="workspace">
          <header>
            <AutoSaveStatus />
            <span>
              {section === 'updates'
                ? t('systemUpdates')
                : section === 'salary'
                ? 'Simulatore Busta Paga NoiPA & TFR'
                : section === 'schools30'
                ? 'Scelta Strategica 30 Scuole & Convocazioni'
                : section === 'dossier'
                ? 'Scheda Fascicolo Sindacati & Backup'
                : t(person ? section : 'people')}
            </span>
            <div>
              {busy && <span role="status">{t('loading')}</span>}
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
                  <button
                    type="button"
                    className="wizard-btn-primary"
                    style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: 12 }}
                    onClick={() => setShowWizard(true)}
                  >
                    <Sparkles size={14} />
                    <span>Configurazione Guidata</span>
                  </button>
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
                ) : section === 'salary' ? (
                  <SalarySimulatorPane person={person} />
                ) : section === 'schools30' ? (
                  <StrategicSchoolsPane person={person} />
                ) : section === 'dossier' ? (
                  <DossierExportPane person={person} />
                ) : section === 'applications' ? (
                  <Applications
                    key={`${person.id}-applications`}
                    person={person}
                    save={save}
                    busy={busy}
                  />
                ) : section === 'child' ? (
                  <FamilyPage
                    key={`${person.id}-family`}
                    person={person}
                    allPeople={archive.people}
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
              <PeopleGrid
                people={archive.people}
                search={search}
                onSearchChange={setSearch}
                onSelect={id => {
                  setSelected(id);
                  setSection('overview');
                }}
                onCreate={() => setCreating(true)}
                onStartWizard={() => setShowWizard(true)}
              />
            )}
          </main>
        </div>
        <FloatingAssistant
          person={person}
          currentSection={section}
          archive={archive}
        />
        {showWizard && (
          <FirstSetupWizard
            person={person}
            allPeople={archive.people}
            busy={busy}
            onCancel={() => setShowWizard(false)}
            onComplete={(savedPerson, nextArchive) => {
              setArchive(nextArchive);
              setSelected(savedPerson.id);
              setShowWizard(false);
            }}
          />
        )}
      </div>
    </AutoSaveContext.Provider>
  );
}
