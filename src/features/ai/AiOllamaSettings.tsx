import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { OllamaModelDetail } from './types';
import { useT } from '../../shared/i18n';

export interface AiOllamaSettingsProps {
  ollamaEndpoint: string;
  setOllamaEndpoint: (e: string) => void;
  ollamaModel: string;
  setOllamaModel: (m: string) => void;
  ollamaModels: string[];
  ollamaModelDetails: OllamaModelDetail[];
  ollamaRunning: boolean | null;
  busy: boolean;
  onRefresh: () => void;
}

export function AiOllamaSettings({
  ollamaEndpoint,
  setOllamaEndpoint,
  ollamaModel,
  setOllamaModel,
  ollamaModels,
  ollamaModelDetails,
  ollamaRunning,
  busy,
  onRefresh,
}: AiOllamaSettingsProps) {
  const t = useT();
  const [copiedCommand, setCopiedCommand] = useState(false);

  const copyPullCommand = () => {
    const cmd = `ollama run ${ollamaModel || 'llama3.2'}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
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
            onClick={onRefresh}
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
              <span>Comando per installare/avviare il modello nel terminale:</span>
            </div>
            <button
              type="button"
              className="mini-btn secondary"
              style={{ fontSize: 10, padding: '2px 8px' }}
              onClick={copyPullCommand}
            >
              {copiedCommand ? <Check size={11} color="#059669" /> : <Copy size={11} />}
              <span>{copiedCommand ? 'Copiato!' : 'Copia'}</span>
            </button>
          </div>
          <code style={{ background: '#1e293b', color: '#f8fafc', padding: '5px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
            ollama run {ollamaModel || 'llama3.2'}
          </code>
        </div>
      </div>
    </div>
  );
}
