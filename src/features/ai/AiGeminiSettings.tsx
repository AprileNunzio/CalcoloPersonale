import React from 'react';
import { ShieldCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { useT } from '../../shared/i18n';

export interface AiGeminiSettingsProps {
  hasGeminiKeySaved: boolean;
  geminiKey: string;
  setGeminiKey: (k: string) => void;
  geminiModel: string;
  setGeminiModel: (m: string) => void;
  geminiModels: string[];
  consent: boolean;
  setConsent: (c: boolean) => void;
  busy: boolean;
  onSaveKey: () => void;
  onRemoveKey: () => void;
}

export function AiGeminiSettings({
  hasGeminiKeySaved,
  geminiKey,
  setGeminiKey,
  geminiModel,
  setGeminiModel,
  geminiModels,
  consent,
  setConsent,
  busy,
  onSaveKey,
  onRemoveKey,
}: AiGeminiSettingsProps) {
  const t = useT();

  return (
    <div className="provider-config-body">
      <div className="privacy-badge-banner">
        <ShieldCheck size={16} className="text-green" />
        <span>{t('geminiCloudPrivacyBanner')}</span>
      </div>

      <div className="config-form-field">
        <label>{t('geminiApiKeyLabel')}</label>
        {hasGeminiKeySaved ? (
          <div className="key-saved-pill">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} className="text-green" />
              <strong>{t('apiKeyConfigured')}</strong>
            </span>
            <button
              type="button"
              className="danger mini-btn"
              disabled={busy}
              onClick={onRemoveKey}
            >
              <Trash2 size={13} />
              {t('removeKey')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              disabled={!geminiKey || busy}
              onClick={onSaveKey}
            >
              {t('save')}
            </button>
          </div>
        )}
      </div>

      {hasGeminiKeySaved && geminiModels.length > 0 && (
        <div className="config-form-field">
          <label>{t('cloudModel')}</label>
          <select
            value={geminiModel}
            onChange={e => setGeminiModel(e.target.value)}
            style={{ width: '100%' }}
          >
            {geminiModels.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="consent-checkbox-wrap">
        <label>
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
          />
          <span>{t('geminiCloudConsentNotice')}</span>
        </label>
      </div>
    </div>
  );
}
