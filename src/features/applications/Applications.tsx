import { useState } from 'react';
import { Entry, Person } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { Plus, Edit2, Trash2, Calendar, FileText, School, MapPin } from 'lucide-react';
import { Icon3dDocument, ProfileBadge3d } from '../../shared/icons3d';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationData } from './types';
import './styles.css';

export function Applications({
  person,
  save,
  busy,
}: {
  person: Person;
  save: (p: Person) => void;
  busy: boolean;
}) {
  const t = useT();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [creating, setCreating] = useState(false);

  const applications = (person.records || []).filter(r => r.kind === 'application');

  const handleSave = (record: Entry) => {
    const existingIndex = person.records.findIndex(r => r.id === record.id);
    let nextRecords: Entry[];
    if (existingIndex >= 0) {
      nextRecords = person.records.map((r, i) => (i === existingIndex ? record : r));
    } else {
      nextRecords = [record, ...person.records];
    }
    save({ ...person, records: nextRecords });
    setCreating(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('deleteRecord'))) {
      const nextRecords = person.records.filter(r => r.id !== id);
      save({ ...person, records: nextRecords });
    }
  };

  if (creating || editing) {
    return (
      <ApplicationForm
        person={person}
        entry={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
        }}
        busy={busy}
      />
    );
  }

  return (
    <div className="applications-container">
      <div className="section-heading">
        <div>
          <h2>{t('applications')}</h2>
          <p className="muted">{t('addApplicationHelp')}</p>
        </div>
        <button onClick={() => setCreating(true)}>
          <Plus size={18} />
          {t('newApplication')}
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="panel empty-app-card">
          <Icon3dDocument size={64} />
          <h3>{t('noApplications')}</h3>
          <p className="muted">{t('addApplicationHelp')}</p>
          <button className="secondary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            {t('newApplication')}
          </button>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map(app => {
            let data: Partial<ApplicationData> = {};
            try {
              if (app.notes.startsWith('{')) {
                data = JSON.parse(app.notes);
              }
            } catch {
              data = {};
            }

            const profiles = data.profiles || (app.profile ? [app.profile] : []);

            return (
              <div className="panel application-card" key={app.id}>
                <div className="app-card-top">
                  <div className="app-card-icon">
                    <Icon3dDocument size={44} />
                  </div>
                  <div className="app-card-header-info">
                    <div className="app-triennium-badge">
                      {data.triennium || app.title}
                    </div>
                    <span className="app-type-tag">
                      {data.applicationType === 'insert' ? t('newInclusion') : t('updateConfirmation')}
                    </span>
                  </div>
                  <div className="app-card-actions">
                    <button
                      className="icon-action-btn"
                      title={t('edit')}
                      onClick={() => setEditing(app)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="icon-action-btn danger"
                      title={t('remove')}
                      onClick={() => handleDelete(app.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="app-profiles-row">
                  <span className="app-row-label">{t('profilesChosen')}:</span>
                  <div className="app-profile-badges">
                    {profiles.map(p => (
                      <ProfileBadge3d key={p} code={p} size={32} />
                    ))}
                  </div>
                </div>

                <div className="app-details-grid">
                  {data.submissionDate && (
                    <div className="app-detail-item">
                      <Calendar size={14} />
                      <span>{data.submissionDate}</span>
                    </div>
                  )}
                  {data.province && (
                    <div className="app-detail-item">
                      <MapPin size={14} />
                      <span>{t('province')}: {data.province}</span>
                    </div>
                  )}
                  {data.protocol && (
                    <div className="app-detail-item wide">
                      <FileText size={14} />
                      <span>ID: {data.protocol}</span>
                    </div>
                  )}
                  {(data.headSchool || app.school) && (
                    <div className="app-detail-item wide">
                      <School size={14} />
                      <span>{(data.headSchool || app.school)?.name} ({data.headSchool?.code || app.school?.code})</span>
                    </div>
                  )}
                </div>

                {(data.declaredAccess || data.declaredCultural || data.declaredServices) && (
                  <div className="app-declarations-box">
                    {data.declaredAccess && (
                      <div className="declaration-row">
                        <strong>{t('declaredAccessTitles')}:</strong>
                        <p>{data.declaredAccess}</p>
                      </div>
                    )}
                    {data.declaredCultural && (
                      <div className="declaration-row">
                        <strong>{t('declaredCulturalTitles')}:</strong>
                        <p>{data.declaredCultural}</p>
                      </div>
                    )}
                    {data.declaredServices && (
                      <div className="declaration-row">
                        <strong>{t('declaredServices')}:</strong>
                        <p>{data.declaredServices}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
