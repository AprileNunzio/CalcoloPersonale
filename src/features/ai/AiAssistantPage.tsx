import { useState, useContext } from 'react';
import { Settings, Trash2, Bot, Cpu, Server, Key } from 'lucide-react';
import { AiConfig, ChatMessage, ChatAttachment } from './types';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AiSettingsModal } from './AiSettingsModal';
import { executeAiQuery } from './aiService';
import { parseAndValidateAiResponse } from './documentOcr';
import { AutoSaveContext, useAutoDraft } from '../autosave/AutoSave';
import { useT } from '../../shared/i18n';
import './aiAssistant.css';

const DEFAULT_CONFIG: AiConfig = {
  provider: 'gemini',
  geminiModel: 'gemini-1.5-flash',
  ollamaEndpoint: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3:latest',
  consent: false,
};

export function AiAssistantPage() {
  const t = useT();
  const context = useContext(AutoSaveContext);
  const [config, setConfig] = useAutoDraft<AiConfig>('ai-config', DEFAULT_CONFIG);
  const [messages, setMessages] = useAutoDraft<ChatMessage[]>('ai-chat-history', []);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);

  const people = context?.archive?.people || [];
  const defaultPersonId = people[0]?.id;

  const handleSendMessage = async (text: string, attachments: ChatAttachment[]) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setBusy(true);

    try {
      const rawResponse = await executeAiQuery(config, text, attachments);
      const { displayText, proposal } = parseAndValidateAiResponse(rawResponse, defaultPersonId);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: displayText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedRecord: proposal,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (reason) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: `${t('aiExecutionError')}: ${typeof reason === 'string' ? reason : t('checkAiConfiguration')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setBusy(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t('confirmClearChat'))) {
      setMessages([]);
    }
  };

  const currentModelLabel =
    config.provider === 'gemini'
      ? config.geminiModel || 'gemini-1.5-flash'
      : config.ollamaModel || 'llama3';

  return (
    <section className="ai-assistant-page">
      <div className="ai-assistant-header">
        <div className="ai-header-title-box">
          <div className="ai-header-badge-icon">
            <Bot size={22} />
          </div>
          <div>
            <h2>{t('assistant')}</h2>
            <div className="ai-provider-pill">
              {config.provider === 'gemini' ? (
                <>
                  <Key size={12} className="text-amber" />
                  <span>Google Gemini · {currentModelLabel}</span>
                </>
              ) : (
                <>
                  <Server size={12} className="text-green" />
                  <span>Ollama Locale · {currentModelLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ai-header-actions">
          <button
            type="button"
            className="secondary mini-btn"
            onClick={handleClearHistory}
            disabled={messages.length === 0 || busy}
            title={t('clearChat')}
          >
            <Trash2 size={15} />
            <span>{t('clear')}</span>
          </button>
          <button
            type="button"
            className="secondary mini-btn"
            onClick={() => setShowSettings(true)}
            title={t('aiSettingsTitle')}
          >
            <Settings size={15} />
            <span>{t('settings')}</span>
          </button>
        </div>
      </div>

      <div className="ai-assistant-main-container">
        <ChatMessages
          messages={messages}
          busy={busy}
          people={people}
        />
        <ChatInput
          onSendMessage={handleSendMessage}
          busy={busy}
        />
      </div>

      {showSettings && (
        <AiSettingsModal
          config={config}
          onSaveConfig={setConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </section>
  );
}
