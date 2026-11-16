import { useState, useContext } from 'react';
import { CheckCircle2, AlertTriangle, Building2, Calendar, Award, User, Pencil, Save, X } from 'lucide-react';
import { ExtractedRecordProposal } from './types';
import { Person, Archive, Entry } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { flush } from '../autosave/store';
import { AutoSaveContext } from '../autosave/AutoSave';
import { useT } from '../../shared/i18n';
import { ATA_PROFILES } from '../../shared/personUtils';
import './proposalCard.css';

export function ProposalCard({
  proposal: initialProposal,
  people,
  onSaved,
}: {
  proposal: ExtractedRecordProposal;
  people: Person[];
  onSaved?: (entryId: string) => void;
}) {
  const t = useT();
  const context = useContext(AutoSaveContext);
  const [proposal, setProposal] = useState<ExtractedRecordProposal>(initialProposal);
  const [editing, setEditing] = useState(proposal.anomalies.length > 0);
  const [selectedPersonId, setSelectedPersonId] = useState(
    proposal.targetPersonId || (people[0]?.id ?? '')
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(proposal.status === 'saved');

  if (proposal.status === 'dismissed') {
    return (
      <div className="proposal-card dismissed">
        <small className="muted">{t('proposalDismissed')}</small>
      </div>
    );
  }

  if (savedSuccess) {
    return (
      <div className="proposal-card saved">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} className="text-green" />
          <strong>{t('recordSavedSuccess')}</strong>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
          {proposal.title} ({proposal.start}{proposal.end ? ` → ${proposal.end}` : ''})
        </p>
      </div>
    );
  }

  const handleSaveToDatabase = async () => {
    if (!selectedPersonId) {
      setError(t('selectPersonRequired'));
      return;
    }
    setBusy(true);
    setError('');

    try {
      await flush();
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        kind: proposal.category,
        title: proposal.title,
        start: proposal.start,
        end: proposal.end,
        amount: null,
        notes: JSON.stringify({
          institution: proposal.institution,
          grade: proposal.grade,
          sector: proposal.sector,
          isAccessTitle: proposal.isAccessTitle,
          extractedViaAi: true,
        }),
        profile: proposal.category === 'service' ? proposal.profile || 'CS' : null,
        school: proposal.institution
          ? {
              code: proposal.schoolCode || '',
              name: proposal.institution,
              address: '',
              postalCode: '',
              municipality: '',
              province: '',
              region: '',
              email: '',
              pec: '',
              website: '',
              schoolYear: '',
              category: '',
            }
          : null,
      };

      const updatedArchive = await call<Archive>('save_record', {
        personId: selectedPersonId,
        entryId: newEntry.id,
        entry: newEntry,
        revision: getRevision(),
      });

      if (context) {
        context.saved(updatedArchive);
      }

      setSavedSuccess(true);
      setProposal(prev => ({ ...prev, status: 'saved' }));
      onSaved?.(newEntry.id);
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : t('saveError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`proposal-card ${proposal.anomalies.length > 0 ? 'has-anomalies' : ''}`}>
      <div className="proposal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`proposal-badge ${proposal.category}`}>
            {t(proposal.category)}
          </span>
          <span className={`confidence-pill ${proposal.confidence}`}>
            {t(`confidence_${proposal.confidence}`)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="secondary mini-btn"
            onClick={() => setEditing(!editing)}
          >
            <Pencil size={13} />
            {t(editing ? 'close' : 'edit')}
          </button>
          <button
            type="button"
            className="secondary mini-btn danger"
            onClick={() => setProposal(prev => ({ ...prev, status: 'dismissed' }))}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {proposal.anomalies.length > 0 && (
        <div className="anomalies-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
            <AlertTriangle size={15} />
            <span>{t('anomaliesDetectedTitle')}</span>
          </div>
          <ul>
            {proposal.anomalies.map(anom => (
              <li key={anom}>{t(anom)}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {editing ? (
        <div className="proposal-edit-form">
          <div className="proposal-field">
            <label>{t('title')}</label>
            <input
              type="text"
              value={proposal.title}
              onChange={e => setProposal({ ...proposal, title: e.target.value })}
            />
          </div>

          <div className="proposal-row">
            <div className="proposal-field">
              <label>{t('start')}</label>
              <input
                type="date"
                value={proposal.start}
                onChange={e => setProposal({ ...proposal, start: e.target.value })}
              />
            </div>
            {proposal.category !== 'title' && (
              <div className="proposal-field">
                <label>{t('end')}</label>
                <input
                  type="date"
                  value={proposal.end || ''}
                  onChange={e => setProposal({ ...proposal, end: e.target.value || null })}
                />
              </div>
            )}
          </div>

          {proposal.category === 'service' && (
            <div className="proposal-row">
              <div className="proposal-field">
                <label>{t('profile')}</label>
                <select
                  value={proposal.profile || 'CS'}
                  onChange={e => setProposal({ ...proposal, profile: e.target.value })}
                >
                  {ATA_PROFILES.map(p => (
                    <option key={p.code} value={p.code}>
                      {p.code} - {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="proposal-field">
                <label>{t('serviceSector')}</label>
                <select
                  value={proposal.sector || 'statale_ata'}
                  onChange={e => setProposal({ ...proposal, sector: e.target.value as any })}
                >
                  <option value="statale_ata">{t('sectorStataleAta')}</option>
                  <option value="statale_docente">{t('sectorStataleDocente')}</option>
                  <option value="paritaria_ata">{t('sectorParitariaAta')}</option>
                  <option value="paritaria_docente">{t('sectorParitariaDocente')}</option>
                </select>
              </div>
            </div>
          )}

          <div className="proposal-field">
            <label>{t('institutionSchool')}</label>
            <input
              type="text"
              value={proposal.institution || ''}
              onChange={e => setProposal({ ...proposal, institution: e.target.value })}
            />
          </div>

          {proposal.category === 'title' && (
            <div className="proposal-field">
              <label>{t('grade')}</label>
              <input
                type="text"
                placeholder="es. 100/100, 84/100, Ottimo"
                value={proposal.grade || ''}
                onChange={e => setProposal({ ...proposal, grade: e.target.value })}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="proposal-preview">
          <h4>{proposal.title}</h4>
          <div className="proposal-details-grid">
            <div className="proposal-detail-item">
              <Calendar size={14} />
              <span>
                {proposal.start}
                {proposal.end ? ` → ${proposal.end}` : ''}
              </span>
            </div>
            {proposal.institution && (
              <div className="proposal-detail-item">
                <Building2 size={14} />
                <span>{proposal.institution}</span>
              </div>
            )}
            {proposal.profile && (
              <div className="proposal-detail-item">
                <Award size={14} />
                <span>{proposal.profile}</span>
              </div>
            )}
            {proposal.grade && (
              <div className="proposal-detail-item">
                <Award size={14} />
                <span>{proposal.grade}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="proposal-actions-bar">
        <div className="person-picker-inline">
          <User size={15} />
          <select
            value={selectedPersonId}
            onChange={e => setSelectedPersonId(e.target.value)}
            disabled={busy || people.length === 0}
          >
            {people.length === 0 ? (
              <option value="">{t('noPeopleInArchive')}</option>
            ) : (
              people.map(p => (
                <option key={p.id} value={p.id}>
                  {p.lastName} {p.firstName}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          type="button"
          disabled={busy || !selectedPersonId}
          onClick={handleSaveToDatabase}
          className="save-proposal-btn"
        >
          <Save size={15} />
          {t('confirmAndSaveToDb')}
        </button>
      </div>
    </div>
  );
}
