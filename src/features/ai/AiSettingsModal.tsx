import { useState, useEffect } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { AiConfig, AiProvider, OllamaModelDetail } from './types';
import {
  fetchGeminiModels,
  checkOllamaStatus,
  saveGeminiApiKey,
  removeGeminiApiKey,
} from './aiService';
import { useT } from '../../shared/i18n';
import { AiGeminiSettings } from './AiGeminiSettings';
import { AiOllamaSettings } from './AiOllamaSettings';
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
      setError(t('ollamaConnectionFailed'));
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
      await loadGemini();
      setSuccess(t('apiKeySaved'));
    } catch (e: any) {
      setError(e?.message || 'Errore durante il salvataggio della chiave');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    setBusy(true);
    try {
      await removeGeminiApiKey();
      setHasGeminiKeySaved(false);
      setGeminiModels([]);
      setSuccess(t('apiKeyRemoved'));
    } catch (e: any) {
      setError(e?.message || 'Errore durante la rimozione');
    } finally {
      setBusy(false);
    }
  };

  const handleApply = () => {
    const updated: AiConfig = {
      provider,
      geminiModel: provider === 'gemini' ? geminiModel : config.geminiModel,
      ollamaEndpoint: provider === 'ollama' ? ollamaEndpoint : config.ollamaEndpoint,
      ollamaModel: provider === 'ollama' ? ollamaModel : config.ollamaModel,
      consent,
    };
    if (onSave) onSave(updated);
    if (onSaveConfig) onSaveConfig(updated);
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

        {provider === 'gemini' ? (
          <AiGeminiSettings
            hasGeminiKeySaved={hasGeminiKeySaved}
            geminiKey={geminiKey}
            setGeminiKey={setGeminiKey}
            geminiModel={geminiModel}
            setGeminiModel={setGeminiModel}
            geminiModels={geminiModels}
            consent={consent}
            setConsent={setConsent}
            busy={busy}
            onSaveKey={() => void handleSaveGeminiKey()}
            onRemoveKey={() => void handleRemoveGeminiKey()}
          />
        ) : (
          <AiOllamaSettings
            ollamaEndpoint={ollamaEndpoint}
            setOllamaEndpoint={setOllamaEndpoint}
            ollamaModel={ollamaModel}
            setOllamaModel={setOllamaModel}
            ollamaModels={ollamaModels}
            ollamaModelDetails={ollamaModelDetails}
            ollamaRunning={ollamaRunning}
            busy={busy}
            onRefresh={() => void loadOllama()}
          />
        )}

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="secondary" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" className="primary" onClick={handleApply}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
