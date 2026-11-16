import { ChatAttachment } from './types';

/**
 * Extracts plain text from a PDF data URI / base64 string.
 * Uses native text stream decoding to extract readable text blocks from contracts and diplomas.
 */
export function extractTextFromPdfBase64(base64Data: string): string {
  try {
    const raw = base64Data.replace(/^data:[^;]+;base64,/, '');
    const binary = atob(raw);

    const extractedTextParts: string[] = [];

    // 1. Match literal text in parentheses: (Text) Tj or (Text) '
    const literalRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|TJ|'|")/g;
    let match;
    while ((match = literalRegex.exec(binary)) !== null) {
      const decoded = match[1]
        .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\r/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, ' ')
        .replace(/\\([\\()])/g, '$1');
      if (decoded.trim().length > 0) {
        extractedTextParts.push(decoded);
      }
    }

    // 2. If literal text extraction found substantial content, return it
    if (extractedTextParts.length >= 5) {
      return extractedTextParts.join(' ').replace(/\s{2,}/g, ' ').trim();
    }

    // 3. Fallback: extract continuous sequences of printable ASCII/Latin characters
    const printableRegex = /[\x20-\x7E\xC0-\xFF]{4,}/g;
    const candidates = binary.match(printableRegex) || [];
    const filtered = candidates.filter(
      s =>
        !s.startsWith('/Filter') &&
        !s.startsWith('/Length') &&
        !s.startsWith('/Type') &&
        !s.startsWith('/Font') &&
        !s.includes('endstream') &&
        !s.includes('endobj') &&
        !s.includes('xref') &&
        !s.includes('trailer')
    );

    if (filtered.length > 0) {
      return filtered.slice(0, 300).join(' ').replace(/\s{2,}/g, ' ').trim();
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Enriches prompt with extracted contents from attached PDFs and images.
 */
export function buildDocumentContext(attachments: ChatAttachment[]): string {
  if (!attachments || attachments.length === 0) return '';

  const chunks: string[] = [];

  for (const att of attachments) {
    if (att.type === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf')) {
      const extracted = extractTextFromPdfBase64(att.base64);
      if (extracted) {
        chunks.push(
          `--- INIZIO DOCUMENTO PDF ALLEGATO: "${att.name}" ---\n${extracted}\n--- FINE DOCUMENTO PDF ---`
        );
      } else {
        chunks.push(
          `[Documento PDF allegato: "${att.name}" (${Math.round(att.size / 1024)} KB)]`
        );
      }
    } else if (att.type.startsWith('image/')) {
      chunks.push(
        `[Immagine/Scansione allegata: "${att.name}" (${Math.round(att.size / 1024)} KB)]`
      );
    }
  }

  return chunks.length > 0 ? `\n\n[DOCUMENTI E ALLEGATI FORNITI DALL'UTENTE]\n${chunks.join('\n\n')}` : '';
}
