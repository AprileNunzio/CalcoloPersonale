import { useState, useEffect } from 'react';
import { X, Key, Server, Check, RefreshCw, ShieldCheck, Trash2, Cpu, Save } from 'lucide-react';
import { AiConfig, AiProvider } from './types';
import { fetchGeminiModels, fetchOllamaModels, saveGeminiApiKey, removeGeminiApiKey } from './aiService';
import { useT } from '../../shared/i18n';

export function AiSettingsModal({
  config,
  onSaveConfig,
  onClose,
}: {
  config: AiConfig;
  onSaveConfig: (cfg: AiConfig) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [provider, setProvider] = useState<AiProvider>(config.provider);
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState(config.geminiModel);
  const [geminiModels, setGeminiModels] = useState<string[]>([]);
  const [consent, setConsent] = useState(config.consent);
  
  const [ollamaEndpoint, setOllamaEndpoint] = useState(config.ollamaEndpoint || 'http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState(config.ollamaModel);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGemini = async () => {
    setBusy(true);
    setError('');
    try {
      const list = await fetchGeminiModels();
      setGeminiModels(list);
      if (!geminiModel && list.length > 0) {
        setGeminiModel(list[0]);
      }
      setSuccess(t('modelsLoadedSuccess'));
    } catch {
      setError(t('geminiKeyNeededOrInvalid'));
    } finally {
      setBusy(false);
    }
  };

  const loadOllama = async () => {
    setBusy(true);
    setError('');
    try {
      const list = await fetchOllamaModels(ollamaEndpoint);
      setOllamaModels(list);
      if (list.length > 0) {
        if (!ollamaModel || !list.includes(ollamaModel)) {
          setOllamaModel(list[0]);
        }
        setSuccess(t('ollamaConnectedSuccess'));
      } else {
        setOllamaModel('');
        setError(t('noOllamaModelsFound'));
      }
    } catch {
      setError(t('ollamaConnectionFailed'));
      setOllamaModels([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (provider === 'gemini') {
      void loadGemini();
    } else {
      void loadOllama();
    }
  }, [provider]);

  const handleSaveGeminiKey = async () => {
    if (!geminiKey) return;
    setBusy(true);
    setError('');
    try {
      await saveGeminiApiKey(geminiKey);
      setGeminiKey('');
      setSuccess(t('credentialSaved'));
      await loadGemini();
    } catch {
      setError(t('invalidApiKey'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    setBusy(true);
    try {
      await removeGeminiApiKey();
      setGeminiModels([]);
      setGeminiModel('');
      setSuccess(t('credentialRemoved'));
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmSettings = () => {
    onSaveConfig({
      provider,
      geminiModel: geminiModel || (geminiModels[0] ?? 'gemini-1.5-flash'),
      ollamaEndpoint: (ollamaEndpoint || 'http://127.0.0.1:11434').trim().replace(/\/+$/, ''),
      ollamaModel: ollamaModel || (ollamaModels[0] ?? ''),
      consent,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content ai-settings-modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={20} className="text-primary" />
            <h3>{t('aiSettingsTitle')}</h3>
          </div>
          <button type="button" className="icon secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="provider-tabs">
          <button
            type="button"
            className={`provider-tab-btn ${provider === 'gemini' ? 'active' : ''}`}
            onClick={() => setProvider('gemini')}
          >
            <Key size={16} />
            <span>Google Gemini</span>
          </button>
          <button
            type="button"
            className={`provider-tab-btn ${provider === 'ollama' ? 'active' : ''}`}
            onClick={() => setProvider('ollama')}
          >
            <Server size={16} />
            <span>Ollama Locale</span>
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {provider === 'gemini' ? (
          <div className="provider-config-body">
            <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px' }}>
              {t('geminiSettingsDesc')}
            </p>

            <div className="config-form-field">
              <label>{t('apiKey')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !geminiKey}
                  onClick={handleSaveGeminiKey}
                >
                  <Save size={14} />
                  {t('saveKey')}
                </button>
              </div>
            </div>

            <div className="config-form-field">
              <label>{t('model')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={geminiModel}
                  onChange={e => setGeminiModel(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {geminiModels.length === 0 ? (
                    <option value="">{t('noModelsLoaded')}</option>
                  ) : (
                    geminiModels.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={loadGemini}
                  title={t('refreshModels')}
                >
                  <RefreshCw size={14} className={busy ? 'spinning' : ''} />
                </button>
              </div>
            </div>

            <label className="checkbox-label" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
              />
              <span style={{ fontSize: '12px' }}>{t('geminiConsent')}</span>
            </label>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="danger mini-btn"
                disabled={busy}
                onClick={handleRemoveGeminiKey}
              >
                <Trash2 size={13} />
                {t('removeKey')}
              </button>
            </div>
          </div>
        ) : (
          <div className="provider-config-body">
            <div className="privacy-badge-banner">
              <ShieldCheck size={16} className="text-green" />
              <span>{t('ollamaLocalPrivacyBanner')}</span>
            </div>

            <div className="config-form-field">
              <label>{t('ollamaEndpointUrl')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={e => setOllamaEndpoint(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={loadOllama}
                  title={t('refreshModels')}
                >
                  <RefreshCw size={14} className={busy ? 'spinning' : ''} />
                  {t('testConnection')}
                </button>
              </div>
            </div>

            <div className="config-form-field">
              <label>{t('localModel')}</label>
              {ollamaModels.length > 0 ? (
                <>
                  <select
                    value={ollamaModel}
                    onChange={e => setOllamaModel(e.target.value)}
                    style={{ width: '100%', marginBottom: 8 }}
                  >
                    {ollamaModels.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ollamaModels.map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`mini-btn ${ollamaModel === m ? '' : 'secondary'}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px' }}
                        onClick={() => setOllamaModel(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: 6 }}>
                    {t('onlyInstalledModelsNotice')}
                  </span>
                </>
              ) : (
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--color-bg-secondary, #f8fafc)',
                  border: '1px dashed var(--color-border, #cbd5e1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text-muted, #64748b)',
                  lineHeight: 1.5,
                }}>
                  {busy ? t('loading') : t('noOllamaModelsFound')}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" onClick={handleConfirmSettings}>
            <Check size={16} />
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
