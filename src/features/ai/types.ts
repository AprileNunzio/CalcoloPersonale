export type AiProvider = 'gemini' | 'ollama';

export interface OllamaModelDetail {
  name: string;
  size?: number;
  parameterSize?: string;
  inMemory?: boolean;
}

export interface AiConfig {
  provider: AiProvider;
  geminiModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  consent: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  previewUrl?: string;
}

export interface ExtractedRecordProposal {
  category: 'title' | 'service' | 'absence' | 'child' | 'validation';
  title: string;
  start: string;
  end: string | null;
  profile?: string | null;
  sector?: 'statale_ata' | 'statale_docente' | 'paritaria_ata' | 'paritaria_docente' | 'ente_locale' | null;
  weeklyHours?: number | null;
  contractType?: 'annual' | 'term' | 'short' | 'permanent' | null;
  absenceType?: 'sickness' | 'specialist' | 'parental' | 'strike' | 'law104' | 'other' | null;
  validatedScore?: number | null;
  institution?: string | null;
  schoolCode?: string | null;
  grade?: string | null;
  isAccessTitle?: boolean;
  anomalies: string[];
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'saved' | 'dismissed';
  targetPersonId?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  extractedRecord?: ExtractedRecordProposal;
  status?: 'sending' | 'analyzing' | 'done' | 'error';
}
