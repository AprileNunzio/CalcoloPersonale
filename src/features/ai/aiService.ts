import { call } from '../../shared/api';
import { AiConfig, ChatAttachment, OllamaModelDetail } from './types';
import { OCR_SYSTEM_PROMPT } from './documentOcr';
import { buildDocumentContext } from './documentParser';
import { getRelevantNormativeContext } from './normativeKnowledge';

export interface OllamaStatusResult {
  isRunning: boolean;
  models: string[];
  modelDetails: OllamaModelDetail[];
  error?: string;
}

export async function fetchGeminiModels(): Promise<string[]> {
  return call<string[]>('gemini_models');
}

/**
 * Checks connection to local Ollama instance and returns the list of installed models with memory and size details.
 */
export async function checkOllamaStatus(endpoint?: string): Promise<OllamaStatusResult> {
  const base = (endpoint || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '');

  // 1. Try Tauri backend command first (avoids any CORS)
  try {
    const list = await call<any[]>('ollama_models', { endpoint: base });
    if (Array.isArray(list)) {
      const modelDetails: OllamaModelDetail[] = list.map(item => {
        if (typeof item === 'string') {
          return { name: item, inMemory: false };
        }
        return {
          name: item.name || item.model || '',
          size: item.size,
          parameterSize: item.parameter_size || item.details?.parameter_size,
          inMemory: Boolean(item.in_memory),
        };
      }).filter(m => Boolean(m.name));

      return {
        isRunning: true,
        models: modelDetails.map(m => m.name),
        modelDetails,
      };
    }
  } catch {}

  // 2. Browser candidates: include local proxy to bypass browser CORS
  const candidates = [
    '/ollama-proxy',
    base,
  ];
  if (base.includes('127.0.0.1')) {
    candidates.push(base.replace('127.0.0.1', 'localhost'));
  } else if (base.includes('localhost')) {
    candidates.push(base.replace('localhost', '127.0.0.1'));
  }

  let serverAlive = false;

  for (const target of candidates) {
    try {
      const response = await fetch(`${target}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const body = await response.json();
        let runningNames: string[] = [];
        try {
          const psRes = await fetch(`${target}/api/ps`);
          if (psRes.ok) {
            const psBody = await psRes.json();
            if (Array.isArray(psBody.models)) {
              runningNames = psBody.models.map((m: any) => m.name || m.model).filter(Boolean);
            }
          }
        } catch {}

        const rawList = Array.isArray(body.models) ? body.models : [];
        const modelDetails: OllamaModelDetail[] = rawList.map((m: any) => {
          const name = m.name || m.model || '';
          const inMemory = runningNames.some(rn => rn === name || rn.startsWith(name + ':') || name.startsWith(rn + ':'));
          return {
            name,
            size: m.size,
            parameterSize: m.details?.parameter_size,
            inMemory,
          };
        }).filter((m: OllamaModelDetail) => Boolean(m.name));

        return {
          isRunning: true,
          models: modelDetails.map(m => m.name),
          modelDetails,
        };
      }
    } catch {}

    try {
      const ping = await fetch(`${target}/`, { method: 'GET' });
      if (ping.ok || ping.status === 200) {
        serverAlive = true;
      }
    } catch {}
  }

  if (serverAlive) {
    return {
      isRunning: true,
      models: [],
      modelDetails: [],
      error: 'Ollama è in esecuzione, ma non è stato ancora scaricato alcun modello.',
    };
  }

  return {
    isRunning: false,
    models: [],
    modelDetails: [],
    error: 'Impossibile connettersi a Ollama su ' + base,
  };
}

export async function fetchOllamaModels(endpoint?: string): Promise<string[]> {
  const res = await checkOllamaStatus(endpoint);
  if (!res.isRunning) {
    throw new Error('ollamaConnectionFailed');
  }
  return res.models;
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
  // Extract text from attached PDFs and metadata from images
  const documentContext = buildDocumentContext(attachments);
  const normativeContext = getRelevantNormativeContext(userPrompt);
  const fullPrompt = `${OCR_SYSTEM_PROMPT}${normativeContext}${documentContext}\n\n[Richiesta Utente]\n${userPrompt}`;

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
      // Default fallback model if user has installed standard llama
      modelToUse = 'llama3.2';
    }

    try {
      return await call<string>('ask_ollama', {
        endpoint,
        model: modelToUse,
        prompt: fullPrompt,
        images: images.length > 0 ? images : null,
      });
    } catch {
      const candidates = [
        '/ollama-proxy',
        endpoint,
      ];
      if (endpoint.includes('127.0.0.1')) {
        candidates.push(endpoint.replace('127.0.0.1', 'localhost'));
      } else if (endpoint.includes('localhost')) {
        candidates.push(endpoint.replace('localhost', '127.0.0.1'));
      }

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
