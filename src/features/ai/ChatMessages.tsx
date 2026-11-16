import { useEffect, useRef } from 'react';
import { Bot, User, FileText, Loader2 } from 'lucide-react';
import { ChatMessage } from './types';
import { Person } from '../../shared/types';
import { ProposalCard } from './ProposalCard';
import { useT } from '../../shared/i18n';

export function ChatMessages({
  messages,
  busy,
  people,
  onRecordSaved,
}: {
  messages: ChatMessage[];
  busy: boolean;
  people: Person[];
  onRecordSaved?: (entryId: string) => void;
}) {
  const t = useT();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  return (
    <div className="chat-messages-scroll-area">
      {messages.length === 0 ? (
        <div className="chat-empty-state">
          <div className="chat-empty-icon">
            <Bot size={40} />
          </div>
          <h3>{t('aiAssistantWelcomeTitle')}</h3>
          <p>{t('aiAssistantWelcomeDesc')}</p>
        </div>
      ) : (
        messages.map(msg => (
          <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
            <div className="chat-avatar">
              {msg.sender === 'assistant' ? <Bot size={18} /> : <User size={18} />}
            </div>

            <div className="chat-bubble-container">
              <div className="chat-message-meta">
                <span className="chat-sender-name">
                  {msg.sender === 'assistant' ? t('assistant') : t('you')}
                </span>
                <span className="chat-timestamp">{msg.timestamp}</span>
              </div>

              {msg.attachments && msg.attachments.length > 0 && (
                <div className="chat-attachments-list">
                  {msg.attachments.map(att => (
                    <div key={att.id} className="chat-attachment-chip">
                      {att.type.startsWith('image/') ? (
                        <img
                          src={att.base64}
                          alt={att.name}
                          className="chat-attachment-thumb"
                        />
                      ) : (
                        <FileText size={16} />
                      )}
                      <span className="chat-attachment-name">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-text-content">
                {msg.text.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {msg.extractedRecord && (
                <ProposalCard
                  proposal={msg.extractedRecord}
                  people={people}
                  onSaved={onRecordSaved}
                />
              )}
            </div>
          </div>
        ))
      )}

      {busy && (
        <div className="chat-message-row assistant">
          <div className="chat-avatar">
            <Bot size={18} />
          </div>
          <div className="chat-bubble-container">
            <div className="chat-thinking-bubble">
              <Loader2 size={16} className="spinning" />
              <span>{t('aiAnalyzingDocument')}</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
