import React from 'react';
import { GraduationCap, Award, Briefcase } from 'lucide-react';
import { Entry } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { FormField } from '../../shared/FormField';
import { ProfileBadge3d } from '../../shared/icons3d';
import { ApplicationData } from './types';
import './applicationPickers.css';

interface ApplicationListPickersProps {
  formData: ApplicationData;
  setFormData: React.Dispatch<React.SetStateAction<ApplicationData>>;
  qualifications: Entry[];
  services: Entry[];
  formatAccessString: (qual?: Entry | null) => string;
  formatCulturalString: (selectedIds: string[]) => string;
  formatServicesString: (selectedIds: string[]) => string;
}

export function ApplicationListPickers({
  formData,
  setFormData,
  qualifications,
  services,
  formatAccessString,
  formatCulturalString,
  formatServicesString,
}: ApplicationListPickersProps) {
  const t = useT();

  const culturalCandidates = qualifications.filter(
    q => q.id !== formData.accessQualificationId
  );

  return (
    <>
      {/* 1. TITOLO DI ACCESSO DICHIARATO */}
      <div className="wide-field app-selection-section">
        <div className="app-selection-header">
          <div className="app-section-title-wrap">
            <GraduationCap size={18} className="text-primary" />
            <div>
              <label className="field-label-text">{t('declaredAccessTitles')}</label>
              <p className="field-hint-text">
                Seleziona il titolo di accesso principale dal fascicolo o assegnalo per profilo.
              </p>
            </div>
          </div>
        </div>

        {qualifications.length > 0 ? (
          <div className="app-access-picker-box">
            <div className="app-picker-row-control">
              <label style={{ fontSize: 12, fontWeight: 650 }}>Scegli dalla lista dei tuoi titoli:</label>
              <select
                value={formData.accessQualificationId || ''}
                onChange={e => {
                  const qId = e.target.value;
                  const chosen = qualifications.find(q => q.id === qId);
                  const nextAccessStr = chosen ? formatAccessString(chosen) : '';
                  const nextCulturalIds = (formData.culturalTitleIds || []).filter(id => id !== qId);
                  setFormData(prev => ({
                    ...prev,
                    accessQualificationId: qId || undefined,
                    declaredAccess: nextAccessStr || prev.declaredAccess,
                    culturalTitleIds: nextCulturalIds,
                    declaredCultural: formatCulturalString(nextCulturalIds),
                  }));
                }}
              >
                <option value="">-- Seleziona titolo di studio dal fascicolo --</option>
                {qualifications.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title} {q.amount ? `· ${q.amount} pt` : ''} {q.start ? `(${q.start})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {formData.profiles.length > 1 && (
              <div className="app-profile-access-assignment">
                <small style={{ fontWeight: 650, color: 'var(--on-surface-variant)' }}>
                  Assegnazione titolo per profilo (se differente):
                </small>
                <div className="app-profile-access-grid">
                  {formData.profiles.map(prof => {
                    const currentAssignedId =
                      formData.accessTitlesByProfile?.[prof] || formData.accessQualificationId || '';
                    return (
                      <div key={prof} className="app-profile-access-item">
                        <div className="app-prof-tag">
                          <ProfileBadge3d code={prof} size={20} />
                          <span>{prof}</span>
                        </div>
                        <select
                          value={currentAssignedId}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              accessTitlesByProfile: {
                                ...(prev.accessTitlesByProfile || {}),
                                [prof]: val,
                              },
                            }));
                          }}
                        >
                          <option value="">
                            Predefinito ({qualifications.find(q => q.id === formData.accessQualificationId)?.title || 'Generale'})
                          </option>
                          {qualifications.map(q => (
                            <option key={q.id} value={q.id}>
                              {q.title} {q.amount ? `(${q.amount} pt)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="app-picker-empty-note">
            Nessun titolo registrato nel fascicolo. Aggiungi i tuoi titoli nella sezione &quot;Titoli&quot;.
          </p>
        )}

        <FormField label="Dicitura ufficiale titolo dichiarata (modificabile)">
          <input
            type="text"
            value={formData.declaredAccess}
            onChange={e => setFormData({ ...formData, declaredAccess: e.target.value })}
            placeholder="es. Diploma di Maturità votazione 84/100 conseguito nel 2012"
          />
        </FormField>
      </div>

      {/* 2. TITOLI CULTURALI E CERTIFICAZIONI DICHIARATI */}
      <div className="wide-field app-selection-section">
        <div className="app-selection-header">
          <div className="app-section-title-wrap">
            <Award size={18} className="text-secondary" />
            <div>
              <label className="field-label-text">{t('declaredCulturalTitles')}</label>
              <p className="field-hint-text">
                Spunta dalla lista le certificazioni informatiche, CIAD o lauree da dichiarare.
              </p>
            </div>
          </div>
          {culturalCandidates.length > 0 && (
            <div className="app-picker-action-links">
              <button
                type="button"
                className="app-picker-link-btn"
                onClick={() => {
                  const allIds = culturalCandidates.map(c => c.id);
                  setFormData(prev => ({
                    ...prev,
                    culturalTitleIds: allIds,
                    declaredCultural: formatCulturalString(allIds),
                  }));
                }}
              >
                Seleziona Tutti ({culturalCandidates.length})
              </button>
              <span className="app-picker-sep">·</span>
              <button
                type="button"
                className="app-picker-link-btn"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    culturalTitleIds: [],
                    declaredCultural: '',
                  }));
                }}
              >
                Deseleziona
              </button>
            </div>
          )}
        </div>

        {culturalCandidates.length > 0 ? (
          <div className="app-items-picker-grid">
            {culturalCandidates.map(c => {
              const isSelected = (formData.culturalTitleIds || []).includes(c.id);
              return (
                <div
                  key={c.id}
                  className={`app-picker-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const currentIds = formData.culturalTitleIds || [];
                    const nextIds = isSelected
                      ? currentIds.filter(id => id !== c.id)
                      : [...currentIds, c.id];
                    setFormData(prev => ({
                      ...prev,
                      culturalTitleIds: nextIds,
                      declaredCultural: formatCulturalString(nextIds),
                    }));
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    tabIndex={-1}
                  />
                  <div className="app-picker-pill-content">
                    <strong>{c.title}</strong>
                    {c.amount ? <span className="app-pill-pts">+{c.amount} pt</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="app-picker-empty-note">
            Nessun titolo culturale aggiuntivo nel fascicolo.
          </p>
        )}

        <FormField label="Dettaglio titoli culturali dichiarati (modificabile)">
          <input
            type="text"
            value={formData.declaredCultural}
            onChange={e => setFormData({ ...formData, declaredCultural: e.target.value })}
            placeholder="es. Certificazione Internazionale di Alfabetizzazione Digitale (CIAD), Dattilografia"
          />
        </FormField>
      </div>

      {/* 3. SERVIZI DICHIARATI */}
      <div className="wide-field app-selection-section">
        <div className="app-selection-header">
          <div className="app-section-title-wrap">
            <Briefcase size={18} className="text-tertiary" />
            <div>
              <label className="field-label-text">{t('declaredServices')}</label>
              <p className="field-hint-text">
                Spunta dalla lista i contratti di servizio da includere nella domanda.
              </p>
            </div>
          </div>
          {services.length > 0 && (
            <div className="app-picker-action-links">
              <button
                type="button"
                className="app-picker-link-btn"
                onClick={() => {
                  const allIds = services.map(s => s.id);
                  setFormData(prev => ({
                    ...prev,
                    serviceIds: allIds,
                    declaredServices: formatServicesString(allIds),
                  }));
                }}
              >
                Seleziona Tutti ({services.length})
              </button>
              <span className="app-picker-sep">·</span>
              <button
                type="button"
                className="app-picker-link-btn"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    serviceIds: [],
                    declaredServices: '',
                  }));
                }}
              >
                Deseleziona
              </button>
            </div>
          )}
        </div>

        {services.length > 0 ? (
          <div className="app-services-picker-list">
            {services.map(s => {
              const isSelected = (formData.serviceIds || []).includes(s.id);
              return (
                <div
                  key={s.id}
                  className={`app-service-picker-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const currentIds = formData.serviceIds || [];
                    const nextIds = isSelected
                      ? currentIds.filter(id => id !== s.id)
                      : [...currentIds, s.id];
                    setFormData(prev => ({
                      ...prev,
                      serviceIds: nextIds,
                      declaredServices: formatServicesString(nextIds),
                    }));
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    tabIndex={-1}
                  />
                  <div className="app-service-picker-info">
                    <div className="app-service-picker-top">
                      <strong>{s.title}</strong>
                      {s.profile && <span className="app-service-prof-badge">{s.profile}</span>}
                    </div>
                    <small>
                      {s.start} → {s.end || 'in corso'}
                      {s.school ? ` · ${s.school.name}` : ''}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="app-picker-empty-note">
            Nessun servizio registrato nel fascicolo.
          </p>
        )}

        <FormField label="Dettaglio servizi dichiarati (modificabile)">
          <textarea
            rows={3}
            value={formData.declaredServices}
            onChange={e => setFormData({ ...formData, declaredServices: e.target.value })}
            placeholder="es. Servizio A.S. 2021/2022 come CS (8 mesi) e 2022/2023 come AA (6 mesi)"
          />
        </FormField>
      </div>
    </>
  );
}
