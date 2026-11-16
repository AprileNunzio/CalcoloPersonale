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
  Copy,
  Check,
} from 'lucide-react';
import { AiConfig, AiProvider, OllamaModelDetail } from './types';
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
  const [ollamaModelDetails, setOllamaModelDetails] = useState<OllamaModelDetail[]>([]);
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

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
      setOllamaModelDetails(res.modelDetails || []);

      if (res.isRunning) {
        if (res.models.length > 0) {
          if (!ollamaModel || !res.models.includes(ollamaModel)) {
            const inMem = res.modelDetails?.find(m => m.inMemory);
            setOllamaModel(inMem ? inMem.name : res.models[0]);
          }
          const ramCount = res.modelDetails?.filter(m => m.inMemory).length || 0;
          setSuccess(
            `Connessione riuscita! Trovati ${res.models.length} modelli in Ollama${ramCount > 0 ? ` (${ramCount} attivo in memoria RAM)` : ''}.`
          );
        } else {
          setSuccess('Ollama è attivo e pronto! Nessun modello ancora scaricato.');
        }
      } else {
        setError(res.error || t('ollamaConnectionFailed'));
      }
    } catch {
      setOllamaRunning(false);
      setError(t('ollamaConnectionFailed'));
      setOllamaModels([]);
      setOllamaModelDetails([]);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
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
              {ollamaModels.length > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                      Modelli Trovati in Ollama ({ollamaModels.length}):
                    </label>
                    <small style={{ color: '#64748b', fontSize: 11 }}>Clicca per selezionare</small>
                  </div>

                  <div className="ollama-models-list">
                    {(ollamaModelDetails.length > 0 ? ollamaModelDetails : (ollamaModels.map(m => ({ name: m })) as OllamaModelDetail[])).map(item => {
                      const isSelected = ollamaModel === item.name || ollamaModel === item.name.split(':')[0];
                      const sizeGb = item.size ? `${(item.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : null;
                      return (
                        <div
                          key={item.name}
                          className={`ollama-model-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setOllamaModel(item.name)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? '5px solid #2563eb' : '2px solid #cbd5e1', background: isSelected ? '#ffffff' : 'transparent', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <strong style={{ fontSize: 13, color: isSelected ? '#1e40af' : '#1e293b' }}>{item.name}</strong>
                                {item.inMemory && <span className="badge-in-memory"><Sparkles size={10} /> In memoria RAM</span>}
                              </div>
                              {(item.parameterSize || sizeGb) && (
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                  {item.parameterSize ? `Parametri: ${item.parameterSize}` : ''}
                                  {item.parameterSize && sizeGb ? ' • ' : ''}
                                  {sizeGb ? `Dimensione: ${sizeGb}` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`mini-btn ${isSelected ? '' : 'secondary'}`}
                            style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOllamaModel(item.name);
                            }}
                          >
                            {isSelected ? '✓ In Uso' : 'Usa Questo'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>Modello attivo:</span>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={e => setOllamaModel(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label>{t('localModel')}</label>
                  <div style={{
                    padding: '10px 12px',
                    background: ollamaRunning ? '#ecfdf5' : '#fffbeb',
                    border: `1px solid ${ollamaRunning ? '#a7f3d0' : '#fde68a'}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: ollamaRunning ? '#065f46' : '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {ollamaRunning ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>
                      {ollamaRunning
                        ? 'Ollama è in esecuzione, ma non ha ancora modelli in memoria. Scaricane uno con il comando sotto:'
                        : 'Ollama non è ancora raggiungibile. Assicurati che l\'applicazione sia aperta.'}
                    </span>
                  </div>

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

              {/* Informative command card with copy button */}
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
                gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e293b' }}>
                    <Terminal size={13} color="#059669" />
                    <span>Comando per scaricare e caricare il modello in memoria:</span>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '2px 8px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleCopyCmd(`ollama run ${ollamaModel || 'llama3.2'}`)}
                  >
                    {copiedCommand ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                    <span>{copiedCommand ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
                <code style={{ background: '#1e293b', color: '#a7f3d0', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                  ollama run {ollamaModel || 'llama3.2'}
                </code>
                <span style={{ color: '#64748b', fontSize: 10 }}>
                  * Esegui questo comando nel terminale (PowerShell / CMD). Ollama scaricherà il modello e lo caricherà subito in memoria.
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
