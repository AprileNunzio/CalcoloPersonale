import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }
    if (fullText.trim().length > 30) {
      return fullText;
    }
  } catch (err) {
    console.warn('pdfjs extraction failed, falling back to stream scanner:', err);
  }

  // Offline fallback: regex stream scan
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(buffer);
    const matches = raw.match(/\(([^)]+)\)\s*(?:Tj|TJ)/g) || [];
    const extracted = matches.map(m => m.replace(/^\(|\)\s*(?:Tj|TJ)$/g, '')).join(' ');
    if (extracted.trim().length > 20) {
      return extracted;
    }
  } catch (err) {
    console.warn('Stream scan failed:', err);
  }

  throw new Error('Impossibile estrarre il testo dal file PDF. Assicurati che non sia protetto da password.');
}
