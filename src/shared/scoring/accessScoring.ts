import { Entry } from '../types';

export function normalizeGrade(val: number): number {
  if (val > 10 && val <= 60) return Math.round(((val / 60) * 10) * 100) / 100;
  if (val > 60 && val <= 100) return Math.round((val / 10) * 100) / 100;
  if (val > 0 && val <= 10) return Math.round(val * 100) / 100;
  return 0.0;
}

export function extractAccessQualification(records: Entry[], profileCode: string): Entry | undefined {
  const quals = (records || []).filter(
    r => r.kind === 'qualification' && (r.profile === profileCode || !r.profile),
  );

  const explicit = quals.find(q => {
    try {
      if (q.notes && q.notes.startsWith('{')) {
        const parsed = JSON.parse(q.notes);
        if (parsed.isAccessTitle) return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  if (explicit) return explicit;

  const byKeyword = quals.find(q => {
    const t = q.title.toLowerCase();
    return (
      (t.includes('diploma') || t.includes('maturit') || t.includes('accesso') || t.includes('licenza') || t.includes('scuola secondaria')) &&
      !t.includes('dattilografia') &&
      !t.includes('laurea')
    );
  });
  if (byKeyword) return byKeyword;

  const byGrade = quals.find(q => {
    const t = q.title.toLowerCase();
    if (t.includes('ciad') || t.includes('alfabetizzazione')) return false;
    return q.amount && q.amount > 0;
  });
  if (byGrade) return byGrade;

  return quals.find(q => {
    const t = q.title.toLowerCase();
    return !t.includes('ciad') && !t.includes('alfabetizzazione');
  });
}

export function computeAccessScore(records: Entry[], profileCode: string): number {
  const qual = extractAccessQualification(records, profileCode);
  if (!qual) return 0.0;

  if (qual.notes) {
    try {
      if (qual.notes.startsWith('{')) {
        const parsed = JSON.parse(qual.notes);
        if (typeof parsed.calculatedPoints === 'number' && parsed.calculatedPoints > 0) {
          return normalizeGrade(parsed.calculatedPoints);
        }
        if (typeof parsed.scoreAchieved === 'number' && typeof parsed.scoreBase === 'number' && parsed.scoreBase > 0) {
          return Math.round(((parsed.scoreAchieved / parsed.scoreBase) * 10) * 100) / 100;
        }
      }
    } catch {
      // ignore
    }
  }

  if (qual.amount && qual.amount > 0) {
    return normalizeGrade(qual.amount);
  }

  const match = qual.title.match(/(\d{1,3})\s*\/\s*(\d{2,3})/);
  if (match) {
    const achieved = parseFloat(match[1]);
    const base = parseFloat(match[2]);
    if (achieved > 0 && base > 0 && achieved <= base) {
      return Math.round(((achieved / base) * 10) * 100) / 100;
    }
  }

  return 0.0;
}
