import { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Trash2,
  ExternalLink,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { AiConfig, AiProvider } from './types';
import {
  fetchGeminiModels,
  checkOllamaStatus,
  saveGeminiApiKey,
  removeGeminiApiKey,
} from './aiService';
import { useT } from '../../shared/i18n';
import './aiAssistant.css';

export function AiSettingsModal({
  config,
  onSave,
  onSaveConfig,
  onClose,
}: {
  config: AiConfig;
  onSave?: (newConfig: AiConfig) => void;
  onSaveConfig?: (newConfig: AiConfig) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [provider, setProvider] = useState<AiProvider>(config.provider);
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState(config.geminiModel || 'gemini-1.5-flash');
  const [geminiModels, setGeminiModels] = useState<string[]>([]);
  const [hasGeminiKeySaved, setHasGeminiKeySaved] = useState(false);

  const [ollamaEndpoint, setOllamaEndpoint] = useState(config.ollamaEndpoint || 'http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState(config.ollamaModel || 'llama3.2');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);

  const [consent, setConsent] = useState(config.consent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGemini = async () => {
    setBusy(true);
    setError('');
    try {
      const list = await fetchGeminiModels();
      setGeminiModels(list);
      setHasGeminiKeySaved(list.length > 0);
      if (list.length > 0 && !list.includes(geminiModel)) {
        setGeminiModel(list[0]);
      }
    } catch {
      setHasGeminiKeySaved(false);
    } finally {
      setBusy(false);
    }
  };

  const loadOllama = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await checkOllamaStatus(ollamaEndpoint);
      setOllamaRunning(res.isRunning);
      setOllamaModels(res.models);

      if (res.isRunning) {
        if (res.models.length > 0) {
          if (!ollamaModel || !res.models.includes(ollamaModel)) {
            setOllamaModel(res.models[0]);
          }
          setSuccess(`Connessione a Ollama riuscita! Rilevati ${res.models.length} modelli installati.`);
        } else {
          setSuccess('Ollama è attivo e in esecuzione! Nessun modello ancora scaricato.');
        }
      } else {
        setError(res.error || t('ollamaConnectionFailed'));
      }
    } catch {
      setOllamaRunning(false);
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
      setSuccess(t('geminiKeySavedSuccess'));
      await loadGemini();
    } catch {
      setError(t('geminiKeySaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    setBusy(true);
    setError('');
    try {
      await removeGeminiApiKey();
      setHasGeminiKeySaved(false);
      setGeminiModels([]);
      setSuccess(t('geminiKeyRemoved'));
    } catch {
      setError(t('geminiKeyRemoveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmSettings = () => {
    if (provider === 'gemini' && !consent) {
      setError(t('consentRequiredForGemini'));
      return;
    }

    const newConfig: AiConfig = {
      provider,
      geminiModel: geminiModel || 'gemini-1.5-flash',
      ollamaEndpoint: (ollamaEndpoint || 'http://127.0.0.1:11434').trim().replace(/\/+$/, ''),
      ollamaModel: (ollamaModel || 'llama3.2').trim(),
      consent: provider === 'gemini' ? consent : false,
    };
    if (onSave) onSave(newConfig);
    if (onSaveConfig) onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content ai-settings-modal">
        <div className="modal-header">
          <h3>
            <Cpu size={20} />
            {t('aiSettingsTitle')}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* PROVIDER SELECTOR TABS */}
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
            <Cpu size={16} />
            <span>Ollama Locale</span>
          </button>
        </div>

        {error && (
          <div className="settings-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="settings-success-banner">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* GEMINI CONFIG */}
        {provider === 'gemini' ? (
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
                    onClick={handleRemoveGeminiKey}
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
                    onClick={handleSaveGeminiKey}
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
        ) : (
          /* OLLAMA LOCAL CONFIG */
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
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={e => setOllamaModel(e.target.value)}
                    placeholder="es. llama3.2 o mistral"
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>Modelli consigliati:</span>
                    {['llama3.2', 'llama3.2-vision', 'mistral', 'qwen2.5', 'gemma2'].map(rec => (
                      <button
                        key={rec}
                        type="button"
                        className="mini-btn secondary"
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}
                        onClick={() => setOllamaModel(rec)}
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Informative command card */}
              <div style={{
                marginTop: 10,
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e293b' }}>
                  <Terminal size={13} color="#059669" />
                  <span>Comando da eseguire in terminale se il modello non è installato:</span>
                </div>
                <code style={{ background: '#1e293b', color: '#a7f3d0', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                  ollama run {ollamaModel || 'llama3.2'}
                </code>
                <span style={{ color: '#64748b', fontSize: 10 }}>
                  * Se usi l'app via browser web, avvia Ollama abilitando le chiamate web con: <code>OLLAMA_ORIGINS="*" ollama serve</code>
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" onClick={handleConfirmSettings}>
            <CheckCircle2 size={16} />
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
