import { useState } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'icon-only' : ''}`}>
      <div className="brand">
        <div className="brand-icon">
          <BriefcaseBusiness size={18} />
        </div>
        {!collapsed && <strong>{t('app')}</strong>}
        <button
          type="button"
          className="sidebar-toggle-btn"
          title={collapsed ? 'Espandi barra laterale' : 'Riduci a solo icone'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      {!collapsed && <div className="side-label">{t('all')}</div>}
      <button
        className={!person && section === 'overview' ? 'nav active' : 'nav'}
        title={t('people')}
        onClick={() => {
          onSelectPerson(null);
          onSelectSection('overview');
        }}
      >
        <Users size={19} />
        {!collapsed && <span className="nav-label">{t('people')}</span>}
        {!collapsed && <span className="nav-badge">{archive.people.length}</span>}
      </button>
      <button
        className="nav nav-wizard"
        title="Configurazione a Step"
        onClick={onOpenWizard}
      >
        <Sparkles size={17} />
        {!collapsed && <span className="nav-label">Configurazione a Step</span>}
      </button>
      {person && (
        <>
          {!collapsed && (
            <div className="side-label">
              {person.firstName} {person.lastName}
            </div>
          )}
          {(() => {
            const isPersonRuolo = Boolean(person.records?.some(r => {
              try {
                if (r.kind === 'service' && r.notes?.startsWith('{')) {
                  const p = JSON.parse(r.notes);
                  return p.isRuolo === true || p.contractType === 'permanent';
                }
              } catch {}
              return false;
            }));

            const navItems = [
              { k: 'overview', icon: LayoutDashboard, lbl: t('overview') },
              { k: 'identity', icon: FolderHeart, lbl: t('identity') },
              { k: 'salary', icon: Banknote, lbl: 'Busta Paga & TFR' },
              ...(!isPersonRuolo ? [{ k: 'naspi', icon: Banknote, lbl: 'Simulatore NASpI ATA' }] : []),
              { k: 'schools30', icon: School, lbl: '30 Scuole & Convocazioni' },
              { k: 'dossier', icon: FileCheck, lbl: 'Scheda Sindacati & Backup' },
              { k: 'applications', icon: FileText, lbl: t('applications') },
              { k: 'service', icon: FolderHeart, lbl: t('service') },
              { k: 'qualification', icon: FolderHeart, lbl: t('qualification') },
              { k: 'child', icon: Users, lbl: t('child') },
              { k: 'absences', icon: FolderHeart, lbl: t('absences') },
            ];

            return navItems.map(({ k, icon: Icon, lbl }) => (
              <button
                className={`nav ${section === k ? 'active' : ''}`}
                key={k}
                title={lbl}
                onClick={() => onSelectSection(k)}
              >
                <Icon size={18} />
                {!collapsed && <span className="nav-label">{lbl}</span>}
              </button>
            ));
          })()}
        </>
      )}
      <div className="sidebar-bottom">
        <button
          className={`nav ${section === 'assistant' ? 'active' : ''}`}
          title={t('assistant')}
          onClick={() => {
            onSelectPerson(null);
            onSelectSection('assistant');
          }}
        >
          <Bot size={17} />
          {!collapsed && <span className="nav-label">{t('assistant')}</span>}
        </button>
        {!collapsed && (
          <div className="secure-label">
            <ShieldCheck size={18} />
            <div>
              {t('secure')}
              <small>{t('local')}</small>
            </div>
          </div>
        )}
        <button
          className={`nav ${section === 'updates' ? 'active' : ''}`}
          title={t('update')}
          onClick={() => {
            onSelectPerson(null);
            onSelectSection('updates');
          }}
        >
          <RefreshCw size={17} />
          {!collapsed && <span className="nav-label">{t('update')}</span>}
        </button>
        <button className="nav" title={t('lock')} disabled={busy} onClick={onLock}>
          <LockKeyhole size={17} />
          {!collapsed && <span className="nav-label">{t('lock')}</span>}
        </button>
      </div>
    </aside>
  );
}
