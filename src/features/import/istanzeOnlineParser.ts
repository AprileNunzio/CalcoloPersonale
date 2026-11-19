export interface ParsedAccessTitle {
  title: string;
  score: number;
  base: number;
  points: number;
  date?: string;
}

export interface ParsedCulturalTitle {
  title: string;
  points: number;
  kind: string;
}

export interface ParsedServicePeriod {
  school: string;
  profile: string;
  start: string;
  end: string;
  isStatale: boolean;
}

export interface ParsedIstanzeOnlineData {
  fiscalCode?: string;
  lastName?: string;
  firstName?: string;
  profiles: string[];
  accessTitle?: ParsedAccessTitle;
  culturalTitles: ParsedCulturalTitle[];
  services: ParsedServicePeriod[];
  hasSpouse?: boolean;
  childrenCount?: number;
}

export function parseIstanzeOnlineText(text: string): ParsedIstanzeOnlineData {
  const cfMatch = text.match(/[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]/i);
  const fiscalCode = cfMatch ? cfMatch[0].toUpperCase() : undefined;

  const cleanTextForProfiles = text
    // Rimuovi anzianità burocratica "aa X mm Y gg Z" per evitare falsi positivi
    .replace(/\baa\s+\d+\s+mm/gi, 'anni mm')
    // Rimuovi la qualifica tabellare generica del CCNL "Assistenti amministrativi ed equiparati"
    .replace(/Assistenti amministrativi ed equiparati/gi, '');

  const profiles: string[] = [];
  if (/collaboratore scolastico|\bprofilo[:\s]+cs\b|\bcs\s*-\s*collaboratore|\barea[:\s]+cs\b/i.test(cleanTextForProfiles)) {
    profiles.push('CS');
  }
  if (/assistente tecnico|\bprofilo[:\s]+at\b|\bat\s*-\s*assistente|\barea[:\s]+at\b/i.test(cleanTextForProfiles)) {
    profiles.push('AT');
  }
  if (/assistente amministrativo|\bprofilo[:\s]+aa\b|\baa\s*-\s*assistente|\barea[:\s]+aa\b/i.test(cleanTextForProfiles)) {
    profiles.push('AA');
  }
  if (/operatore scolastico|\bprofilo[:\s]+os\b|\bos\s*-\s*operatore/i.test(cleanTextForProfiles)) {
    profiles.push('OS');
  }
  if (/cuoco|\bprofilo[:\s]+cu\b|\bprofilo[:\s]+co\b/i.test(cleanTextForProfiles)) {
    profiles.push('CU');
  }
  if (/guardarobiere|\bprofilo[:\s]+gu\b|\bprofilo[:\s]+ga\b/i.test(cleanTextForProfiles)) {
    profiles.push('GU');
  }
  if (/addetto aziende agrarie|\bprofilo[:\s]+cr\b/i.test(cleanTextForProfiles)) {
    profiles.push('CR');
  }

  let accessTitle: ParsedAccessTitle | undefined;
  const scoreMatch =
    text.match(/(?:votazione|voto|punti|punteggio)[^\d]*(\d{1,3})\s*(?:\/|\s+su\s+)\s*(\d{2,3})/i) ||
    text.match(/(\d{1,3})\s*\/\s*(\d{2,3})/);

  if (scoreMatch) {
    const score = parseFloat(scoreMatch[1]);
    const base = parseFloat(scoreMatch[2]);
    if (score > 0 && base > 0 && score <= base) {
      const points = Number(((score / base) * 10).toFixed(2));
      accessTitle = {
        title: `Diploma di Scuola Secondaria (${score}/${base})`,
        score,
        base,
        points,
      };
    }
  }

  const culturalTitles: ParsedCulturalTitle[] = [];
  if (/alfabetizzazione|ciad/i.test(text)) {
    culturalTitles.push({
      title: 'Certificazione Internazionale di Alfabetizzazione Digitale (CIAD)',
      points: 0,
      kind: 'ciad',
    });
  }
  if (/dattilografia/i.test(text)) {
    culturalTitles.push({
      title: 'Corso di Addestramento alla Dattilografia',
      points: 1.0,
      kind: 'typing',
    });
  }
  if (/eipass|icdl|ecdl|digcomp|pekit/i.test(text)) {
    culturalTitles.push({
      title: 'Certificazione Informatica (EIPASS / ICDL / DigComp)',
      points: profiles.includes('CS') && profiles.length === 1 ? 0.30 : 0.60,
      kind: 'digital',
    });
  }
  if (/laurea/i.test(text)) {
    culturalTitles.push({
      title: 'Diploma di Laurea',
      points: 2.0,
      kind: 'degree',
    });
  }

  const services: ParsedServicePeriod[] = [];
  const dateRangeRegex = /(?:Dal\s+)?(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\s*(?:al|a|-|–)\s*(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/gi;
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = dateRangeRegex.exec(text)) !== null) {
    const rawStart = match[1];
    const rawEnd = match[2];
    const matchIndex = match.index;

    // Isola solo il blocco di testo relativo a questo specifico intervallo (fino al prossimo record o a capo)
    const afterMatch = text.slice(matchIndex + match[0].length);
    const nextBoundary = afterMatch.search(/\n\s*(?:Dal\b|\d{1,2}\))/i);
    const lineSnippet = (nextBoundary !== -1 ? afterMatch.slice(0, nextBoundary) : afterMatch.slice(0, 160)).toLowerCase();

    // Salta assenze, malattie, permessi o scioperi appartenenti a questa voce
    if (
      lineSnippet.includes('assenza per') ||
      lineSnippet.includes('assenza suscettibile') ||
      lineSnippet.includes('sciopero') ||
      lineSnippet.includes('permesso per motivi') ||
      lineSnippet.includes('permesso per lutto') ||
      lineSnippet.includes('permesso per matrimonio') ||
      lineSnippet.includes('permesso in qualita') ||
      lineSnippet.includes('congedo di maternita')
    ) {
      continue;
    }

    const toIso = (dStr: string) => {
      const parts = dStr.split(/[\/\-.]/);
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dStr;
    };

    // Determina il profilo specifico di questo incarico
    let periodProfile = profiles[0] || 'CS';
    if (lineSnippet.includes('assistente tecnico') || lineSnippet.includes('elettronica ed elettrotecnica')) {
      periodProfile = 'AT';
    } else if (lineSnippet.includes('collaboratore scolastico') || lineSnippet.includes('collaboratori scolastici')) {
      periodProfile = 'CS';
    } else if (lineSnippet.includes('assistente amministrativo') && !lineSnippet.includes('ed equiparati')) {
      periodProfile = 'AA';
    }

    // Estrai la scuola se presente nel contesto
    let schoolName = `Servizio Scolastico ${counter}`;
    const schoolMatch = lineSnippet.match(/sede principale[:\s]+([^-\n]+)/i);
    if (schoolMatch && schoolMatch[1]) {
      schoolName = schoolMatch[1].trim();
      schoolName = schoolName.charAt(0).toUpperCase() + schoolName.slice(1);
    }

    services.push({
      school: schoolName,
      profile: periodProfile,
      start: toIso(rawStart),
      end: toIso(rawEnd),
      isStatale: !lineSnippet.includes('paritaria'),
    });
    counter++;
  }

  const hasSpouse = /coniuge|marito|moglie/i.test(text);
  let childrenCount = 0;
  const childMatch = text.match(/(\d+)\s*figli/i);
  if (childMatch) {
    childrenCount = parseInt(childMatch[1], 10);
  } else if (/figli/i.test(text)) {
    childrenCount = 1;
  }

  return {
    fiscalCode,
    profiles: profiles.length > 0 ? profiles : ['CS'],
    accessTitle,
    culturalTitles,
    services,
    hasSpouse,
    childrenCount,
  };
}
