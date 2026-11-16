import { call } from '../../shared/api';
import { AiConfig, ChatAttachment } from './types';
import { OCR_SYSTEM_PROMPT } from './documentOcr';

export async function fetchGeminiModels(): Promise<string[]> {
  return call<string[]>('gemini_models');
}

export async function fetchOllamaModels(endpoint?: string): Promise<string[]> {
  return call<string[]>('ollama_models', { endpoint: endpoint || 'http://127.0.0.1:11434' });
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  return call<void>('configure_gemini', { key });
}

export async function removeGeminiApiKey(): Promise<void> {
  return call<void>('remove_gemini_key');
}

export async function executeAiQuery(
  config: AiConfig,
  userPrompt: string,
  attachments: ChatAttachment[] = []
): Promise<string> {
  const fullPrompt = `${OCR_SYSTEM_PROMPT}\n\n[Richiesta Utente]\n${userPrompt}`;

  if (config.provider === 'ollama') {
    const images: string[] = attachments
      .filter(att => att.type.startsWith('image/'))
      .map(att => att.base64.replace(/^data:image\/[a-z]+;base64,/, ''));

    return call<string>('ask_ollama', {
      endpoint: config.ollamaEndpoint || 'http://127.0.0.1:11434',
      model: config.ollamaModel,
      prompt: fullPrompt,
      images: images.length > 0 ? images : null,
    });
  }

  const geminiImages = attachments
    .filter(att => att.type.startsWith('image/') || att.type === 'application/pdf')
    .map(att => {
      const mime = att.type || 'image/jpeg';
      const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
      return {
        mime_type: mime,
        data: cleanBase64,
      };
    });

  return call<string>('ask_gemini', {
    prompt: fullPrompt,
    model: config.geminiModel,
    consent: config.consent,
    images: geminiImages.length > 0 ? geminiImages : null,
  });
}
