import {
  Plus,
  Search,
  ArrowUpRight,
  UserRound,
  Sparkles,
  Award,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  Upload,
  Download,
} from 'lucide-react';
import { Venus, Mars } from './GenderIcons';
import { Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { getPersonCurrentProfile } from '../../shared/personUtils';
import { ProfileBadge3d } from '../../shared/icons3d';
import { calculateProfileScores } from '../../shared/scoring';
import { exportPersonToFile } from '../sync/personExport';
import './peopleGrid.css';

export function PeopleGrid({
  people,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  onStartWizard,
  onImportFile,
}: {
  people: Person[];
  search: string;
  onSearchChange: (val: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onStartWizard: () => void;
  onImportFile?: (content: string) => void;
}) {
  const t = useT();

  const filtered = people.filter(p =>
    `${p.lastName} ${p.firstName}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()) ||
    (p.fiscalCode && p.fiscalCode.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  );

  const totalServicesAcrossAll = people.reduce(
    (acc, p) => acc + (p.records || []).filter(r => r.kind === 'service').length,
    0
  );
  const totalQualsAcrossAll = people.reduce(
    (acc, p) => acc + (p.records || []).filter(r => r.kind === 'qualification').length,
    0
  );

  return (
    <div className="people-dashboard-container">
      {/* Hero Welcome Section */}
      <div className="people-hero-section">
        <div className="hero-text-col">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            <span>CALCOLO PERSONALE • GESTIONE FASCICOLI ATA</span>
          </div>
          <h1 className="hero-title">{t('welcome')}</h1>
          <p className="hero-subtitle">
            Gestisci anagrafiche, calcolo punteggi graduatorie di terza fascia, monitoraggio 24 mesi e simulatore busta paga NoiPA.
          </p>

          <div className="hero-stats-strip">
            <div className="hero-stat-pill">
              <Users size={14} color="var(--primary)" />
              <span><strong>{people.length}</strong> {people.length === 1 ? 'fascicolo' : 'fascicoli'}</span>
            </div>
            <div className="hero-stat-pill">
              <BriefcaseBusiness size={14} color="var(--primary)" />
              <span><strong>{totalServicesAcrossAll}</strong> servizi registrati</span>
            </div>
            <div className="hero-stat-pill">
              <GraduationCap size={14} color="var(--secondary)" />
              <span><strong>{totalQualsAcrossAll}</strong> titoli e certificazioni</span>
            </div>
          </div>
        </div>

        <div className="hero-actions-col">
          <button className="wizard-btn-primary" onClick={onStartWizard}>
            <Sparkles size={18} />
            <span>Configurazione Guidata a Step</span>
          </button>
          <button className="add-person-btn-secondary" onClick={onCreate}>
            <Plus size={18} />
            <span>{t('newPerson')}</span>
          </button>
          <label className="import-person-btn" title="Importa fascicolo esportato (.json)">
            <Upload size={18} />
            <span>{t('importPerson')}</span>
            <input
              type="file"
              accept=".json,.calcolopersonale"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file && onImportFile) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const content = ev.target?.result;
                    if (typeof content === 'string') {
                      onImportFile(content);
                    }
                  };
                  reader.readAsText(file);
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {/* Collection Search & Header */}
      <div className="collection-bar">
        <div className="collection-title-wrap">
          <h2>
            {t('people')}
            <span className="people-count-badge">{people.length}</span>
          </h2>
          <span className="collection-subtext">Seleziona una persona per accedere al fascicolo completo</span>
        </div>

        <div className="search-box-modern">
          <Search size={18} className="search-icon-modern" />
          <input
            type="text"
            aria-label={t('search')}
            placeholder="Cerca per nominativo o codice fiscale..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Cancella ricerca"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Grid of Person Cards */}
      <div className="person-grid">
        {filtered.map(p => {
          const profile = getPersonCurrentProfile(p);
          const scores = calculateProfileScores(p, false);
          const topScore = scores.length > 0
            ? [...scores].sort((a, b) => b.totalScore - a.totalScore)[0]
            : null;

          const serviceRecords = (p.records || []).filter(r => r.kind === 'service');
          const serviceDays = scores.length > 0
            ? Math.max(...scores.map(s => s.serviceDays))
            : serviceRecords.reduce((acc, s) => {
                const d1 = new Date(s.start);
                const d2 = s.end ? new Date(s.end) : new Date(s.start);
                if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return acc + 1;
                return acc + Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              }, 0);

          const quals = (p.records || []).filter(r => r.kind === 'qualification');
          const qualsCount = quals.length;
          const hasCiad = quals.some(q => {
            const str = (q.title + ' ' + (q.notes || '')).toLowerCase();
            return str.includes('ciad') || str.includes('alfabetizzazione') || str.includes('digcomp');
          });
          const familyCount = (p.records || []).filter(r => r.kind === 'child').length;

          return (
            <div
              className="person-card-modern"
              key={p.id}
              onClick={() => onSelect(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(p.id);
              }}
            >
              {/* Card Header */}
              <div className="card-header-modern">
                <div className="avatar-section">
                  <div className={`avatar-circle ${p.gender}`}>
                    {p.gender === 'female' ? (
                      <Venus />
                    ) : p.gender === 'male' ? (
                      <Mars />
                    ) : (
                      <UserRound size={24} />
                    )}
                  </div>
                  {profile && profile.code !== '—' && (
                    <div className="profile-badge-overlay" title={`Profilo attivo: ${profile.code}`}>
                      <ProfileBadge3d code={profile.code} size={22} />
                    </div>
                  )}
                </div>

                <div className="person-identity-col">
                  <div className="identity-tags-row">
                    {profile && profile.code !== '—' ? (
                      <span className="profile-chip-active">
                        {profile.code}
                      </span>
                    ) : (
                      <span className="profile-chip-empty">In config.</span>
                    )}

                    {p.fiscalCode && (
                      <span className="cf-code-chip" title="Codice Fiscale">
                        <CreditCard size={11} />
                        {p.fiscalCode}
                      </span>
                    )}
                  </div>
                  <h3 className="person-card-fullname">
                    {p.lastName} {p.firstName}
                  </h3>
                  {p.birthDate && (
                    <div className="person-sub-meta">
                      <Calendar size={11} />
                      <span>{p.birthDate}{p.birthPlace ? ` • ${p.birthPlace}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card KPI Metrics Grid */}
              <div className="card-kpi-grid">
                <div className="card-kpi-tile">
                  <div className="tile-title">
                    <Award size={13} color="var(--primary)" />
                    <span>Punteggio ATA</span>
                  </div>
                  <div className="tile-number">
                    {topScore && (topScore.effectiveScore > 0 || topScore.totalScore > 0) ? (
                      <>
                        <span className="number-bold">{topScore.effectiveScore.toFixed(2)}</span>
                        <span className="number-unit">
                          pt ({topScore.code}){topScore.useValidatedScore ? ' ✓' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="number-muted">Da calcolare</span>
                    )}
                  </div>
                  <div className="tile-foot">
                    {topScore?.useValidatedScore
                      ? `✓ Convalidato da Decreto Scuola`
                      : topScore && topScore.totalScore > 0
                      ? `${topScore.baseAccessScore.toFixed(1)} tit. + ${(topScore.specificServiceScore + topScore.otherServiceScore).toFixed(1)} serv.`
                      : 'Nessun titolo registrato'}
                  </div>
                </div>

                <div className="card-kpi-tile">
                  <div className="tile-title">
                    <BriefcaseBusiness size={13} color="var(--primary)" />
                    <span>Servizio ATA (24M)</span>
                  </div>
                  <div className="tile-number">
                    {serviceDays > 0 ? (
                      <>
                        <span className="number-bold">{serviceDays}</span>
                        <span className="number-unit">gg</span>
                      </>
                    ) : (
                      <span className="number-muted">0 giorni</span>
                    )}
                  </div>
                  <div className="tile-foot">
                    {serviceDays >= 706 ? (
                      <span className="status-24m-ok">✓ 24 Mesi Raggiunti</span>
                    ) : serviceDays > 0 ? (
                      <span>{Math.round((serviceDays / 706) * 100)}% ({706 - serviceDays} gg a 24M)</span>
                    ) : (
                      <span>Nessun servizio registrato</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges / Details Strip */}
              <div className="card-badges-strip">
                <span className="detail-tag">
                  <FileText size={11} /> {p.records.length} {t('records')}
                </span>
                {qualsCount > 0 && (
                  <span className="detail-tag">
                    <GraduationCap size={11} /> {qualsCount} {qualsCount === 1 ? 'titolo' : 'titoli'}
                  </span>
                )}
                {hasCiad && (
                  <span className="detail-tag ciad-verified" title="Certificazione Internazionale di Alfabetizzazione Digitale valida per D.M. 89/2024">
                    <ShieldCheck size={11} /> CIAD OK
                  </span>
                )}
                {familyCount > 0 && (
                  <span className="detail-tag">
                    <Users size={11} /> {familyCount} {familyCount === 1 ? 'familiare' : 'familiari'}
                  </span>
                )}
              </div>

              {/* Card Footer Action */}
              <div className="card-footer-modern">
                <button
                  type="button"
                  className="card-export-btn"
                  title="Esporta fascicolo su file singolo (.json)"
                  onClick={e => {
                    e.stopPropagation();
                    exportPersonToFile(p);
                  }}
                >
                  <Download size={12} />
                  <span>{t('exportPerson')}</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  <span className="footer-action-text">{t('open')}</span>
                  <div className="footer-arrow-circle">
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Person Card */}
        <div
          className="add-card-modern"
          onClick={onCreate}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') onCreate();
          }}
        >
          <div className="add-icon-circle-modern">
            <Plus size={28} />
          </div>
          <div className="add-card-text">
            <h4>Nuovo Fascicolo</h4>
            <p>Aggiungi manualmente una nuova anagrafica ATA</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!people.length && (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <Sparkles size={34} />
          </div>
          <h3>Nessun fascicolo presente in archivio</h3>
          <p>
            Inizia subito con la <strong>Configurazione Guidata a Step</strong>: ti aiuteremo passo dopo passo nella compilazione di anagrafica, titolo di studio d’accesso, certificazioni informatiche CIAD e servizi scolastici con spiegazioni dettagliate dalla A alla Z!
          </p>
          <button className="wizard-btn-primary" onClick={onStartWizard}>
            <Sparkles size={18} />
            <span>Avvia Prima Configurazione a Step</span>
          </button>
        </div>
      )}
    </div>
  );
}
