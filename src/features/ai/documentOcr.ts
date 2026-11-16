import { ExtractedRecordProposal } from './types';

export const OCR_SYSTEM_PROMPT = `Sei l'Assistente AI esperto per il Personale ATA della Scuola Statale Italiana (CCNL Comparto Istruzione e Ricerca).
Il tuo compito principale è assistere l'utente, rispondere a quesiti normativi e analizzare documenti, diplomi, certificazioni informatiche (es. CIAD), contratti di lavoro o certificati di servizio.

Se l'utente allega uno o più documenti/immagini, esegui una scansione OCR accurata del testo visibile.
Se nel documento rilevi un titolo di studio/qualifica, un servizio prestato, o un periodo di assenza, restituisci alla fine della tua risposta dettagliata un blocco JSON formattato esattamente così:

<<<RECORD_JSON
{
  "category": "title" | "service" | "absence",
  "title": "Denominazione esatta (es. Diploma di Maturità Scientifica, Contratto CS a T.D., CIAD)",
  "start": "AAAA-MM-GG" (data conseguimento o inizio servizio),
  "end": "AAAA-MM-GG" | null (data fine servizio se applicabile, altrimenti null),
  "profile": "CS" | "AA" | "AT" | "CR" | "GA" | "CO" | "IF" | null,
  "sector": "statale_ata" | "statale_docente" | "paritaria_ata" | "paritaria_docente" | null,
  "institution": "Nome istituto o scuola",
  "schoolCode": "Codice meccanografico se leggibile, altrimenti null",
  "grade": "Votazione (es. 100/100, 84/100, Ottimo)" | null,
  "isAccessTitle": boolean,
  "anomalies": ["elenco di eventuali dubbi o anomalie riscontrate nella lettura"],
  "confidence": "high" | "medium" | "low"
}
RECORD_JSON>>>

Se non è presente alcun documento da catalogare, rispondi semplicemente in modo chiaro ed esaustivo senza aggiungere il blocco JSON.`;

export function parseAndValidateAiResponse(
  rawText: string,
  defaultPersonId?: string
): { displayText: string; proposal?: ExtractedRecordProposal } {
  const jsonMatch = rawText.match(/<<<RECORD_JSON([\s\S]*?)RECORD_JSON>>>/);
  
  if (!jsonMatch) {
    return { displayText: rawText.trim() };
  }

  const displayText = rawText.replace(/<<<RECORD_JSON[\s\S]*?RECORD_JSON>>>/, '').trim();
  const jsonContent = jsonMatch[1].trim();

  try {
    const parsed = JSON.parse(jsonContent);
    const anomalies: string[] = Array.isArray(parsed.anomalies) ? [...parsed.anomalies] : [];

    const category = parsed.category === 'service' || parsed.category === 'absence' ? parsed.category : 'title';

    if (!parsed.start || parsed.start.length < 4) {
      anomalies.push('anomalyMissingStartDate');
    }

    if (category === 'service') {
      if (!parsed.end) {
        anomalies.push('anomalyMissingEndDate');
      } else if (parsed.start && parsed.end && parsed.end < parsed.start) {
        anomalies.push('anomalyInvalidDateRange');
      }
      if (!parsed.profile) {
        anomalies.push('anomalyUnclearProfile');
      }
      if (!parsed.sector) {
        anomalies.push('anomalyUnclearSector');
      }
    }

    if (category === 'title' && !parsed.grade) {
      anomalies.push('anomalyMissingGrade');
    }

    const proposal: ExtractedRecordProposal = {
      category,
      title: parsed.title || 'Documento Rilevato',
      start: parsed.start || '',
      end: parsed.end || null,
      profile: parsed.profile || (category === 'service' ? 'CS' : null),
      sector: parsed.sector || (category === 'service' ? 'statale_ata' : null),
      institution: parsed.institution || null,
      schoolCode: parsed.schoolCode || null,
      grade: parsed.grade || null,
      isAccessTitle: !!parsed.isAccessTitle,
      anomalies,
      confidence: parsed.confidence === 'low' ? 'low' : parsed.confidence === 'medium' ? 'medium' : 'high',
      status: 'pending',
      targetPersonId: defaultPersonId,
      notes: parsed.institution ? `Rilasciato da: ${parsed.institution}` : '',
    };

    return { displayText, proposal };
  } catch {
    return { displayText: rawText.trim() };
  }
}
