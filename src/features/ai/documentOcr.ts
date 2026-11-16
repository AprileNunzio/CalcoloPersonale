import { ExtractedRecordProposal } from './types';

export const OCR_SYSTEM_PROMPT = `Sei l'Assistente AI esperto per il Personale ATA della Scuola Statale Italiana (CCNL Comparto Istruzione e Ricerca).
Il tuo compito principale è assistere l'utente, rispondere a quesiti normativi, analizzare contratti, diplomi, certificazioni (es. CIAD), decreti di convalida e assenze, e permettere all'utente di inserire o modificare i dati del fascicolo direttamente dalla chat.

Se l'utente allega uno o più documenti/immagini/PDF, o se ti chiede esplicitamente in chat di inserire un contratto, un titolo, una malattia o un decreto, rispondi con una spiegazione dettagliata e alla fine della tua risposta includi SEMPRE un blocco JSON formattato esattamente come segue:

<<<RECORD_JSON
{
  "category": "title" | "service" | "absence" | "child" | "validation",
  "title": "Denominazione esatta (es. Diploma di Maturità, Contratto Collaboratore Scolastico, Certificazione CIAD, Congedo)",
  "start": "AAAA-MM-GG" (data inizio servizio, conseguimento titolo o nascita figlio),
  "end": "AAAA-MM-GG" | null (data fine per servizi o assenze, null per titoli/figli),
  "profile": "CS" | "AA" | "AT" | "OS" | "CU" | "GU" | "CR" | "DOCENTE" | null,
  "sector": "statale_ata" | "statale_docente" | "paritaria_ata" | "paritaria_docente" | "ente_locale" | null,
  "weeklyHours": 36 (o 18, 12, ecc.),
  "contractType": "annual" | "term" | "short" | "permanent" | null,
  "absenceType": "sickness" | "specialist" | "parental" | "strike" | "law104" | "other" | null,
  "validatedScore": 15.50 | null,
  "institution": "Nome scuola o istituto emittente",
  "schoolCode": "Codice meccanografico se leggibile, altrimenti null",
  "grade": "Votazione (es. 100/100, 84/100, 8.50, Ottimo)" | null,
  "isAccessTitle": boolean,
  "anomalies": ["elenco di eventuali dubbi o informazioni mancanti"],
  "confidence": "high" | "medium" | "low"
}
RECORD_JSON>>>

Se la richiesta è solo una domanda informativa generale senza documenti da registrare o azioni richieste, rispondi in modo esaustivo senza aggiungere il blocco RECORD_JSON.`;

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

    const rawCat = parsed.category;
    const category: ExtractedRecordProposal['category'] =
      rawCat === 'service' || rawCat === 'absence' || rawCat === 'child' || rawCat === 'validation'
        ? rawCat
        : 'title';

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
    }

    if (category === 'title' && !parsed.grade) {
      anomalies.push('anomalyMissingGrade');
    }

    const proposal: ExtractedRecordProposal = {
      category,
      title: parsed.title || (category === 'service' ? 'Contratto di Servizio' : 'Nuovo Documento'),
      start: parsed.start || '',
      end: parsed.end || null,
      profile: parsed.profile || (category === 'service' ? 'CS' : null),
      sector: parsed.sector || (category === 'service' ? 'statale_ata' : null),
      weeklyHours: typeof parsed.weeklyHours === 'number' ? parsed.weeklyHours : (parsed.profile === 'DOCENTE' ? 18 : 36),
      contractType: parsed.contractType || 'term',
      absenceType: parsed.absenceType || (category === 'absence' ? 'sickness' : null),
      validatedScore: typeof parsed.validatedScore === 'number' ? parsed.validatedScore : null,
      institution: parsed.institution || null,
      schoolCode: parsed.schoolCode || null,
      grade: parsed.grade ? String(parsed.grade) : null,
      isAccessTitle: Boolean(parsed.isAccessTitle),
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
