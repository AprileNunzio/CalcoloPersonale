import { useState, useContext } from 'react';
import { Entry, Person, Archive } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { call, getRevision } from '../../shared/api';
import { flush } from '../autosave/store';
import { AutoSaveContext } from '../autosave/AutoSave';
import { Plus, Edit2, Trash2, Calendar, FileText, School, MapPin, TrendingUp, Building2, ShieldCheck } from 'lucide-react';
import { Icon3dDocument, ProfileBadge3d } from '../../shared/icons3d';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationData } from './types';
import { WorkProbabilityPane } from '../probability/WorkProbabilityPane';
import { ScoreValidationPane } from '../convalidation/ScoreValidationPane';
import './styles.css';

export function Applications({
  person,
  save,
  busy,
}: {
  person: Person;
  save?: (p: Person) => void;
  busy: boolean;
}) {
  const t = useT();
  const context = useContext(AutoSaveContext);
  const [viewMode, setViewMode] = useState<'applications' | 'convalidation' | 'probability'>('applications');
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const applications = (person.records || []).filter(r => r.kind === 'application');

  const handleSave = async (record: Entry, closeOnSave = true) => {
    setPending(true);
    setError('');
    try {
      await flush();
      const validId = record.id && record.id.trim().length > 0 ? record.id.trim() : crypto.randomUUID();
      const recordToSave: Entry = { ...record, id: validId };
      const updatedArchive = await call<Archive>('save_record', {
        personId: person.id,
        entryId: validId,
        entry: recordToSave,
        revision: getRevision(),
      });
      if (context) {
        context.saved(updatedArchive);
      } else if (save) {
        const existingIndex = person.records.findIndex(r => r.id === validId);
        const nextRecords = existingIndex >= 0
          ? person.records.map((r, i) => (i === existingIndex ? recordToSave : r))
          : [recordToSave, ...person.records];
        save({ ...person, records: nextRecords });
      }
      if (closeOnSave) {
        setCreating(false);
        setEditing(null);
      } else {
        setEditing(recordToSave);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'error');
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteRecord'))) return;
    setPending(true);
    setError('');
    try {
      await flush();
      const updatedArchive = await call<Archive>('delete_record', {
        personId: person.id,
        entryId: id,
        revision: getRevision(),
      });
      if (context) {
        context.saved(updatedArchive);
      } else if (save) {
        const nextRecords = person.records.filter(r => r.id !== id);
        save({ ...person, records: nextRecords });
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'error');
    } finally {
      setPending(false);
    }
  };

  if (creating || editing) {
    return (
      <div className="applications-container">
        {error && (
          <div className="error" style={{ marginBottom: 16 }}>
            {t(error)}
          </div>
        )}
        <ApplicationForm
          person={person}
          entry={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
            setError('');
          }}
          busy={busy || pending}
        />
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="section-heading">
        <div>
          <h2>
            {viewMode === 'applications'
              ? t('applications')
              : viewMode === 'convalidation'
              ? 'Convalida Punteggi & Normative ATA'
              : t('workProbability')}
          </h2>
          <p className="muted">
            {viewMode === 'applications'
              ? t('addApplicationHelp')
              : viewMode === 'convalidation'
              ? 'Verifica e convalida ufficiale dei titoli e servizi secondo i D.M. 89/2024, 50/2021 e 640/2017 con tetto annuale di 6 punti.'
              : t('workProbabilitySubtitle')}
          </p>
        </div>
        <div className="app-heading-actions">
          <div className="app-mode-tabs">
            <button
              type="button"
              className={`app-mode-tab-btn ${viewMode === 'applications' ? 'active' : ''}`}
              onClick={() => setViewMode('applications')}
            >
              <FileText size={15} />
              <span>{t('applications')}</span>
            </button>
            <button
              type="button"
              className={`app-mode-tab-btn ${viewMode === 'convalidation' ? 'active' : ''}`}
              onClick={() => setViewMode('convalidation')}
            >
              <ShieldCheck size={15} />
              <span>Convalida & Normative</span>
            </button>
            <button
              type="button"
              className={`app-mode-tab-btn ${viewMode === 'probability' ? 'active' : ''}`}
              onClick={() => setViewMode('probability')}
            >
              <TrendingUp size={15} />
              <span>{t('workProbability')}</span>
            </button>
          </div>
          {viewMode === 'applications' && (
            <button onClick={() => setCreating(true)}>
              <Plus size={18} />
              {t('newApplication')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {t(error)}
        </div>
      )}

      {viewMode === 'convalidation' ? (
        <ScoreValidationPane person={person} busy={busy || pending} />
      ) : viewMode === 'probability' ? (
        <WorkProbabilityPane person={person} selectedApplication={selectedApp} />
      ) : applications.length === 0 ? (
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
                  {data.chosenSchools && data.chosenSchools.length > 0 && (
                    <div className="app-detail-item wide highlight-schools">
                      <Building2 size={14} />
                      <span><strong>{data.chosenSchools.length} / 30</strong> {t('schoolsSelected')}</span>
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

                <div className="app-card-footer">
                  <button
                    type="button"
                    className="app-card-prob-btn"
                    onClick={() => {
                      setSelectedApp(data as ApplicationData);
                      setViewMode('probability');
                    }}
                  >
                    <TrendingUp size={14} />
                    <span>{t('workProbability')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
