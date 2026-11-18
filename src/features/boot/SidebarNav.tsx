import {
  BriefcaseBusiness,
  FolderHeart,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  Users,
  RefreshCw,
  FileText,
  Bot,
  Sparkles,
  Banknote,
  School,
  FileCheck,
} from 'lucide-react';
import { Person, Archive } from '../../shared/types';
import { useT } from '../../shared/i18n';

export interface SidebarNavProps {
  archive: Archive;
  person: Person | undefined;
  section: string;
  busy: boolean;
  onSelectPerson: (id: string | null) => void;
  onSelectSection: (s: string) => void;
  onOpenWizard: () => void;
  onLock: () => void;
}

export function SidebarNav({
  archive,
  person,
  section,
  busy,
  onSelectPerson,
  onSelectSection,
  onOpenWizard,
  onLock,
}: SidebarNavProps) {
  const t = useT();

  return (
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
          onSelectPerson(null);
          onSelectSection('overview');
        }}
      >
        <Users size={19} />
        {t('people')}
        <span>{archive.people.length}</span>
      </button>
      <button
        className="nav"
        onClick={onOpenWizard}
        style={{ color: '#116b62', fontWeight: 650 }}
      >
        <Sparkles size={17} />
        <span>Configurazione a Step</span>
      </button>
      {person && (
        <>
          <div className="side-label">
            {person.firstName} {person.lastName}
          </div>
          {[
            { k: 'overview', icon: LayoutDashboard, lbl: t('overview') },
            { k: 'identity', icon: FolderHeart, lbl: t('identity') },
            { k: 'salary', icon: Banknote, lbl: 'Busta Paga & TFR' },
            { k: 'schools30', icon: School, lbl: '30 Scuole & Convocazioni' },
            { k: 'dossier', icon: FileCheck, lbl: 'Scheda Sindacati & Backup' },
            { k: 'applications', icon: FileText, lbl: t('applications') },
            { k: 'service', icon: FolderHeart, lbl: t('service') },
            { k: 'qualification', icon: FolderHeart, lbl: t('qualification') },
            { k: 'child', icon: Users, lbl: t('child') },
            { k: 'absences', icon: FolderHeart, lbl: t('absences') },
          ].map(({ k, icon: Icon, lbl }) => (
            <button
              className={`nav ${section === k ? 'active' : ''}`}
              key={k}
              onClick={() => onSelectSection(k)}
            >
              <Icon size={18} /> {lbl}
            </button>
          ))}
        </>
      )}
      <div className="sidebar-bottom">
        <button
          className={`nav ${section === 'assistant' ? 'active' : ''}`}
          onClick={() => {
            onSelectPerson(null);
            onSelectSection('assistant');
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
            onSelectPerson(null);
            onSelectSection('updates');
          }}
        >
          <RefreshCw size={17} />
          {t('update')}
        </button>
        <button className="nav" disabled={busy} onClick={onLock}>
          <LockKeyhole size={17} />
          {t('lock')}
        </button>
      </div>
    </aside>
  );
}
