import { useState, useMemo } from 'react';
import {
  Bot,
  Maximize2,
  Minimize2,
  Settings,
  Trash2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Person, Archive } from '../../shared/types';
import { useT } from '../../shared/i18n';
import { useAutoDraft } from '../autosave/AutoSave';
import { ChatMessage, ChatAttachment, AiConfig } from './types';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AiSettingsModal } from './AiSettingsModal';
import { executeAiQuery } from './aiService';
import { OCR_SYSTEM_PROMPT, parseAndValidateAiResponse } from './documentOcr';
import './floatingAssistant.css';

const DEFAULT_CONFIG: AiConfig = {
  provider: 'gemini',
  geminiModel: 'gemini-1.5-flash',
  ollamaEndpoint: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3:latest',
  consent: false,
};

export function FloatingAssistant({
  person,
  currentSection,
  archive,
}: {
  person?: Person;
  currentSection: string;
  archive: Archive | null;
}) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [messages, setMessages] = useAutoDraft<ChatMessage[]>(
    'ai-copilot-history',
    []
  );

  const [config, setConfig] = useAutoDraft<AiConfig>('ai-config', DEFAULT_CONFIG);

  const defaultPersonId = person?.id || archive?.people[0]?.id;

  const sectionName = useMemo(() => {
    switch (currentSection) {
      case 'overview':
        return t('pageContextOverview');
      case 'identity':
        return t('pageContextIdentity');
      case 'service':
        return t('pageContextService');
      case 'qualification':
        return t('pageContextQualification');
      case 'child':
        return t('pageContextFamily');
      case 'absences':
        return t('pageContextAbsences');
      case 'applications':
        return t('pageContextApplications');
      case 'updates':
        return t('pageContextUpdates');
      default:
        return t('pageContextPeople');
    }
  }, [currentSection, t]);

  const contextualPrompts = useMemo(() => {
    switch (currentSection) {
      case 'service':
        return [
          t('copilotPromptService1'),
          t('copilotPromptService2'),
          t('copilotPromptGeneral1'),
        ];
      case 'absences':
        return [
          t('copilotPromptAbsence1'),
          t('copilotPromptAbsence2'),
          t('copilotPromptGeneral1'),
        ];
      case 'child':
        return [
          t('copilotPromptFamily1'),
          t('copilotPromptFamily2'),
          t('copilotPromptGeneral1'),
        ];
      case 'applications':
        return [
          t('copilotPromptApp1'),
          t('copilotPromptGeneral2'),
          t('copilotPromptGeneral1'),
        ];
      default:
        return [
          t('copilotPromptGeneral1'),
          t('copilotPromptGeneral2'),
          t('copilotPromptService1'),
        ];
    }
  }, [currentSection, t]);

  const handleSendMessage = async (
    text: string,
    attachments: ChatAttachment[]
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const userMsgId = crypto.randomUUID();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: time,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setBusy(true);

    try {
      const contextPrefix = `[CONTESTO SCHEDA: ${sectionName}${
        person
          ? `, PERSONA: ${person.lastName} ${person.firstName} (Profilo: ${
              person.profile || 'Non impostato'
            })`
          : ''
      }]\n\n`;

      const promptToSend =
        attachments.length > 0
          ? `${OCR_SYSTEM_PROMPT}\n\n${contextPrefix}${
              text.trim() ? text : t('askAboutAttachedDoc')
            }`
          : `${contextPrefix}${text}`;

      const rawResponse = await executeAiQuery(
        config,
        promptToSend,
        attachments
      );
      const { displayText, proposal } = parseAndValidateAiResponse(
        rawResponse,
        defaultPersonId
      );

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: displayText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        extractedRecord: proposal,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: `${t('aiExecutionError')}. ${t('checkAiConfiguration')}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setBusy(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t('confirmClearChat'))) {
      setMessages([]);
    }
  };

  return (
    <>
      <aside className="floating-copilot-container">
        {!isOpen ? (
          <button
            type="button"
            className="floating-copilot-trigger"
            onClick={() => setIsOpen(true)}
            title={t('floatingAssistantTooltip')}
            aria-label={t('floatingAssistantTooltip')}
          >
            <div className="copilot-pulse-ring" />
            <div className="copilot-icon-wrapper">
              <Bot size={22} />
            </div>
            <span className="copilot-pill-label">
              <Sparkles size={13} />
              <span>Copilot</span>
            </span>
          </button>
        ) : (
          <div
            className={`floating-copilot-window ${
              isExpanded ? 'expanded' : ''
            }`}
          >
            <div className="floating-copilot-header">
              <div className="copilot-header-info">
                <div className="copilot-avatar-box">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="copilot-header-title">
                    <strong>{t('floatingAssistantTitle')}</strong>
                    <span className="copilot-status-dot" />
                  </div>
                  <div className="copilot-context-badge">
                    <span>{sectionName}</span>
                    {person && (
                      <span className="person-tag">
                        · {person.lastName} {person.firstName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="copilot-header-actions">
                <button
                  type="button"
                  className="icon-mini"
                  title={t(isExpanded ? 'collapse' : 'expand')}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  type="button"
                  className="icon-mini"
                  title={t('aiSettingsTitle')}
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings size={15} />
                </button>
                <button
                  type="button"
                  className="icon-mini"
                  title={t('clearChat')}
                  onClick={handleClearHistory}
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  className="icon-mini close"
                  title={t('closeForm')}
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronDown size={17} />
                </button>
              </div>
            </div>

            <div className="floating-copilot-body">
              <ChatMessages
                messages={messages}
                busy={busy}
                people={archive?.people || []}
              />
            </div>

            <div className="floating-copilot-footer">
              <ChatInput
                busy={busy}
                onSendMessage={handleSendMessage}
                customQuickPrompts={contextualPrompts}
              />
            </div>
          </div>
        )}
      </aside>

      {isSettingsOpen && (
        <AiSettingsModal
          config={config}
          onSaveConfig={cfg => {
            setConfig(cfg);
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
}
