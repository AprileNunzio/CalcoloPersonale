import { Person, Entry } from './types';
import { ATA_PROFILES, PROFILE_LABELS } from './personUtils';

export interface ProfileScore {
  code: string;
  label: string;
  baseAccessScore: number;
  specificServiceScore: number;
  otherServiceScore: number;
  culturalScore: number;
  totalScore: number;
  serviceDays: number;
  specificDays: number;
}

function parseDays(start: string, end: string | null): number {
  const dStart = new Date(start);
  const dEnd = end ? new Date(end) : new Date(start);
  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()) || dEnd < dStart) return 1;
  const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function calculateMonths(days: number): number {
  if (days <= 0) return 0;
  const fullMonths = Math.floor(days / 30);
  const remainder = days % 30;
  return fullMonths + (remainder > 15 ? 1 : 0);
}

function normalizeGrade(val: number): number {
  if (val > 10 && val <= 60) return Math.round(((val / 60) * 10) * 100) / 100;
  if (val > 60 && val <= 100) return Math.round((val / 10) * 100) / 100;
  if (val > 0 && val <= 10) return Math.round(val * 100) / 100;
  return 0.0;
}

export function extractAccessQualification(records: Entry[], profileCode: string): Entry | undefined {
  const quals = records.filter(
    r => r.kind === 'qualification' && (r.profile === profileCode || !r.profile),
  );

  // 1. Explicitly flagged as access title
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

  // 2. By keywords
  const byKeyword = quals.find(q => {
    const t = q.title.toLowerCase();
    return (
      (t.includes('diploma') || t.includes('maturit') || t.includes('accesso') || t.includes('licenza') || t.includes('scuola secondaria')) &&
      !t.includes('dattilografia') &&
      !t.includes('laurea')
    );
  });
  if (byKeyword) return byKeyword;

  // 3. By amount > 0 and not CIAD
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

function computeAccessScore(records: Entry[], profileCode: string): number {
  const qual = extractAccessQualification(records, profileCode);
  if (!qual) return 0.0;

  // Check notes
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

  // Check amount
  if (qual.amount && qual.amount > 0) {
    return normalizeGrade(qual.amount);
  }

  // Check title for fraction (es. 80/100, 54/60, 100/100)
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

function computeCulturalScore(records: Entry[], profileCode: string, accessQualId?: string): number {
  let score = 0;
  const quals = records.filter(r => r.kind === 'qualification' && r.id !== accessQualId);
  for (const q of quals) {
    const t = q.title.toLowerCase();
    if (t.includes('alfabetizzazione') || t.includes('ciad') || t.includes('ecdl') || t.includes('eipass') || t.includes('informatica')) {
      score += profileCode === 'CS' ? 0.30 : 0.60;
      break;
    }
  }
  if (profileCode === 'AA') {
    if (quals.some(q => q.title.toLowerCase().includes('dattilografia'))) {
      score += 1.0;
    }
    if (quals.some(q => q.title.toLowerCase().includes('laurea'))) {
      score += 2.0;
    }
  } else if (profileCode === 'AT') {
    if (quals.some(q => q.title.toLowerCase().includes('laurea'))) {
      score += 2.0;
    }
  } else if (profileCode === 'OS') {
    if (quals.some(q => q.title.toLowerCase().includes('oss') || q.title.toLowerCase().includes('osa'))) {
      score += 1.0;
    }
  }
  return Math.round(score * 100) / 100;
}

export function getActiveProfiles(person: Person): string[] {
  const activeSet = new Set<string>();
  const records = person.records || [];

  for (const r of records) {
    if (r.kind === 'application') {
      try {
        if (r.notes && r.notes.startsWith('{')) {
          const data = JSON.parse(r.notes);
          if (Array.isArray(data.profiles)) {
            data.profiles.forEach((p: string) => activeSet.add(p));
          }
        }
      } catch {
        if (r.profile) activeSet.add(r.profile);
      }
      if (r.profile) activeSet.add(r.profile);
    } else if (r.kind === 'service' && r.profile) {
      if (r.profile !== 'DOCENTE') activeSet.add(r.profile);
    }
  }

  if (activeSet.size === 0 && person.profile && person.profile in PROFILE_LABELS) {
    activeSet.add(person.profile);
  }

  return Array.from(activeSet);
}

export function calculateProfileScores(person: Person, onlyActive = true): ProfileScore[] {
  const activeCodes = getActiveProfiles(person);
  if (onlyActive && activeCodes.length === 0) {
    return [];
  }
  const profilesToEvaluate = onlyActive
    ? ATA_PROFILES.filter(p => activeCodes.includes(p.code))
    : ATA_PROFILES;

  const services = (person.records || []).filter(r => r.kind === 'service');
  return profilesToEvaluate.map(prof => {
    let specificDays = 0;
    let otherDays = 0;
    let specificServiceScore = 0;
    let otherServiceScore = 0;

    for (const s of services) {
      const days = parseDays(s.start, s.end);
      const isParitaria = (s.title + ' ' + (s.notes || '')).toLowerCase().includes('paritaria');
      const isDocente =
        s.profile === 'DOCENTE' || (s.title + ' ' + (s.notes || '')).toLowerCase().includes('docente');

      const mult = isParitaria ? 0.5 : 1.0;

      if (isDocente) {
        const rate = (prof.code === 'CS' || prof.code === 'OS' ? 0.15 : 0.10) * mult;
        const months = calculateMonths(days);
        otherServiceScore += Math.round(months * rate * 100) / 100;
        otherDays += days;
      } else if (s.profile === prof.code) {
        const rate = (prof.code === 'CS' ? 0.50 : 0.60) * mult;
        const months = calculateMonths(days);
        specificServiceScore += Math.round(months * rate * 100) / 100;
        specificDays += days;
      } else {
        const rate = (prof.code === 'CS' || prof.code === 'OS' ? 0.15 : 0.10) * mult;
        const months = calculateMonths(days);
        otherServiceScore += Math.round(months * rate * 100) / 100;
        otherDays += days;
      }
    }

    const accessQual = extractAccessQualification(person.records || [], prof.code);
    const baseAccessScore = computeAccessScore(person.records || [], prof.code);
    const culturalScore = computeCulturalScore(person.records || [], prof.code, accessQual?.id);
    const totalScore = Math.round((baseAccessScore + specificServiceScore + otherServiceScore + culturalScore) * 100) / 100;
    return {
      code: prof.code,
      label: PROFILE_LABELS[prof.code] || prof.label,
      baseAccessScore,
      specificServiceScore: Math.round(specificServiceScore * 100) / 100,
      otherServiceScore: Math.round(otherServiceScore * 100) / 100,
      culturalScore,
      totalScore,
      serviceDays: specificDays + otherDays,
      specificDays,
    };
  });
}
