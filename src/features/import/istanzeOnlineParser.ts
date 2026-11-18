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

  const profiles: string[] = [];
  if (/collaboratore scolastico|\bcs\b/i.test(text)) profiles.push('CS');
  if (/assistente amministrativo|\baa\b/i.test(text)) profiles.push('AA');
  if (/assistente tecnico|\bat\b/i.test(text)) profiles.push('AT');
  if (/operatore scolastico|\bos\b/i.test(text)) profiles.push('OS');
  if (/cuoco|\bcu\b/i.test(text)) profiles.push('CU');
  if (/guardarobiere|\bgu\b/i.test(text)) profiles.push('GU');
  if (/addetto aziende agrarie|\bcr\b/i.test(text)) profiles.push('CR');

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
  const dateRangeRegex = /(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\s*(?:al|a|-|–)\s*(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/gi;
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = dateRangeRegex.exec(text)) !== null) {
    const rawStart = match[1];
    const rawEnd = match[2];

    const toIso = (dStr: string) => {
      const parts = dStr.split(/[\/\-.]/);
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dStr;
    };

    services.push({
      school: `Servizio Scolastico ${counter}`,
      profile: profiles[0] || 'CS',
      start: toIso(rawStart),
      end: toIso(rawEnd),
      isStatale: !text.toLowerCase().includes('paritaria'),
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
