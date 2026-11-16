import { Analysis, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { ShieldCheck, CalendarDays, GraduationCap, Clock3, Award } from 'lucide-react';
import { calculateProfileScores } from '../../shared/scoring';
import { ProfileBadge3d } from '../../shared/icons3d';
import './Dashboard.css';

export function Dashboard({
  person,
  data,
  year,
  setYear,
}: {
  person?: Person;
  data: Analysis | null;
  year: number;
  setYear: (y: number) => void;
}) {
  const t = useT();
  const profileScores = person ? calculateProfileScores(person) : [];

  const stats = [
    { key: 'serviceDays', value: data?.serviceDays, icon: CalendarDays },
    { key: 'absenceDays', value: data?.recordedAbsenceDays, icon: Clock3 },
    { key: 'qualifications', value: data?.qualifications, icon: GraduationCap },
  ];

  return (
    <div className="dashboard-root">
      <div className="section-heading">
        <div>
          <h2>{t('dashboard')}</h2>
          <p className="muted">{t('reference')}</p>
        </div>
        <label className="school-year-select">
          {t('schoolYear')}
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
              <option key={y} value={y}>
                {y}/{y + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stats">
        {stats.map(s => (
          <div className="panel stat" key={s.key}>
            <s.icon size={22} />
            <strong>{s.value ?? '—'}</strong>
            <span>{t(s.key)}</span>
          </div>
        ))}
      </div>

      <div className="profile-scores-section">
        <div className="scores-header">
          <div className="scores-header-title">
            <Award size={20} className="scores-icon" />
            <div>
              <h3>{t('calculatedScores')}</h3>
              <p className="muted">{t('calculatedScoresHelp')}</p>
            </div>
          </div>
        </div>

        <div className="profile-scores-grid">
          {profileScores.map(score => (
            <div className={`score-card profile-${score.code}`} key={score.code}>
              <div className="score-card-top">
                <ProfileBadge3d code={score.code} size={42} />
                <div className="score-card-titles">
                  <h4>{score.label}</h4>
                  <span className="profile-code-tag">{score.code}</span>
                </div>
                <div className="score-total-badge">
                  <strong>{score.totalScore.toFixed(2)}</strong>
                  <small>{t('points')}</small>
                </div>
              </div>

              <div className="score-breakdown-row">
                <div className="breakdown-item" title={t('baseAccess')}>
                  <span className="lbl">{t('baseAccess')}</span>
                  <span className="val">{score.baseAccessScore.toFixed(2)}</span>
                </div>
                <div className="breakdown-item" title={t('specificService')}>
                  <span className="lbl">{t('specificService')}</span>
                  <span className="val">{score.specificServiceScore.toFixed(2)}</span>
                </div>
                <div className="breakdown-item" title={t('otherService')}>
                  <span className="lbl">{t('otherService')}</span>
                  <span className="val">{score.otherServiceScore.toFixed(2)}</span>
                </div>
                <div className="breakdown-item" title={t('culturalTitles')}>
                  <span className="lbl">{t('culturalTitles')}</span>
                  <span className="val">{score.culturalScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel evidence">
        <ShieldCheck size={20} />
        <h3>{t('evidence')}</h3>
        {data?.warnings.map(w => (
          <p key={w}>{t(w)}</p>
        ))}
      </div>

      <div className="panel">
        <h3>{t('children')}</h3>
        {data?.children.length ? (
          data.children.map((c, i) => (
            <div className="entry" key={i}>
              <strong>{c.name}</strong>
              <span>
                {c.age} {t('age')}
              </span>
            </div>
          ))
        ) : (
          <p className="muted">{t('noRecords')}</p>
        )}
      </div>
    </div>
  );
}
