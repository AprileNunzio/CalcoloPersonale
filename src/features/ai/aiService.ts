import { call } from '../../shared/api';
import { AiConfig, ChatAttachment } from './types';
import { OCR_SYSTEM_PROMPT } from './documentOcr';

export async function fetchGeminiModels(): Promise<string[]> {
  return call<string[]>('gemini_models');
}

export async function fetchOllamaModels(endpoint?: string): Promise<string[]> {
  const base = (endpoint || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '');
  
  try {
    const list = await call<string[]>('ollama_models', { endpoint: base });
    if (Array.isArray(list)) return list;
  } catch {}

  const candidates = [base];
  if (base.includes('127.0.0.1')) {
    candidates.push(base.replace('127.0.0.1', 'localhost'));
  } else if (base.includes('localhost')) {
    candidates.push(base.replace('localhost', '127.0.0.1'));
  }

  for (const target of candidates) {
    try {
      const response = await fetch(`${target}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const body = await response.json();
        if (Array.isArray(body.models)) {
          return body.models.map((m: any) => m.name || m.model).filter(Boolean);
        }
      }
    } catch {}
  }

  throw new Error('ollamaConnectionFailed');
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
      .map(att => att.base64.replace(/^data:[^;]+;base64,/, ''));

    const endpoint = (config.ollamaEndpoint || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '');

    let modelToUse = config.ollamaModel?.trim();
    if (!modelToUse) {
      try {
        const installed = await fetchOllamaModels(endpoint);
        if (installed.length > 0) {
          modelToUse = installed[0];
        }
      } catch {}
    }

    if (!modelToUse) {
      throw new Error('noOllamaModelSelected');
    }

    try {
      return await call<string>('ask_ollama', {
        endpoint,
        model: modelToUse,
        prompt: fullPrompt,
        images: images.length > 0 ? images : null,
      });
    } catch {
      const candidates = [endpoint];
      if (endpoint.includes('127.0.0.1')) candidates.push(endpoint.replace('127.0.0.1', 'localhost'));
      else if (endpoint.includes('localhost')) candidates.push(endpoint.replace('localhost', '127.0.0.1'));

      for (const target of candidates) {
        try {
          const payload: any = {
            model: modelToUse,
            prompt: fullPrompt,
            stream: false,
          };
          if (images.length > 0) {
            payload.images = images;
          }
          const response = await fetch(`${target}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            const body = await response.json();
            if (body.response) return body.response;
          }
        } catch {}
      }
      throw new Error('ollamaConnectionFailed');
    }
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
