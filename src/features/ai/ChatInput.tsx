import { useState, useRef, ChangeEvent, KeyboardEvent, DragEvent } from 'react';
import { Paperclip, Send, X, FileText, Image, Sparkles } from 'lucide-react';
import { ChatAttachment } from './types';
import { useT } from '../../shared/i18n';

export function ChatInput({
  onSendMessage,
  busy,
  disabled,
}: {
  onSendMessage: (text: string, attachments: ChatAttachment[]) => void;
  busy: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    t('quickPrompt1'),
    t('quickPrompt2'),
    t('quickPrompt3'),
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return;

      const reader = new FileReader();
      reader.onload = e => {
        const base64 = e.target?.result as string;
        const newAttachment: ChatAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64,
          previewUrl: file.type.startsWith('image/') ? base64 : undefined,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSend = () => {
    if (busy || disabled || (!text.trim() && attachments.length === 0)) return;
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  return (
    <div
      className={`chat-input-wrapper ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="quick-prompts-bar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            className="quick-prompt-chip"
            onClick={() => setText(prompt)}
            disabled={busy || disabled}
          >
            <Sparkles size={12} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {attachments.length > 0 && (
        <div className="staged-attachments-row">
          {attachments.map(att => (
            <div key={att.id} className="staged-attachment-pill">
              {att.type.startsWith('image/') ? (
                <Image size={14} className="text-blue" />
              ) : (
                <FileText size={14} className="text-amber" />
              )}
              <span className="staged-attachment-name">{att.name}</span>
              <button
                type="button"
                className="remove-staged-btn"
                onClick={() => removeAttachment(att.id)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={onFileInputChange}
        />

        <button
          type="button"
          className="attach-file-btn"
          title={t('attachDocumentTooltip')}
          disabled={busy || disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={18} />
        </button>

        <textarea
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachments.length > 0 ? t('askAboutAttachedDoc') : t('chatInputPlaceholder')}
          disabled={busy || disabled}
          className="chat-textarea"
        />

        <button
          type="button"
          className="send-message-btn"
          disabled={busy || disabled || (!text.trim() && attachments.length === 0)}
          onClick={handleSend}
          title={t('send')}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
