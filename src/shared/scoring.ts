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
  if (val <= 10) return Math.round(val * 100) / 100;
  return 0.0;
}

function computeAccessScore(records: Entry[], profileCode: string): number {
  const qual = records.find(
    r => r.kind === 'qualification' && (r.profile === profileCode || !r.profile),
  );
  if (qual) {
    if (qual.amount && qual.amount > 0) {
      return normalizeGrade(qual.amount);
    }
    return 0.0;
  }
  return 0.0;
}

function computeCulturalScore(records: Entry[], profileCode: string): number {
  let score = 0;
  const quals = records.filter(r => r.kind === 'qualification');
  for (const q of quals) {
    const t = q.title.toLowerCase();
    if (t.includes('alfabetizzazione') || t.includes('ciad') || t.includes('ecdl') || t.includes('eipass') || t.includes('informatica')) {
      score += 0.50;
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
      activeSet.add(r.profile);
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
    for (const s of services) {
      const days = parseDays(s.start, s.end);
      if (s.profile === prof.code) {
        specificDays += days;
      } else {
        otherDays += days;
      }
    }
    const specificMonths = calculateMonths(specificDays);
    const otherMonths = calculateMonths(otherDays);
    const specificServiceScore = Math.round(specificMonths * 0.50 * 100) / 100;
    const otherMonthlyRate = prof.code === 'CS' || prof.code === 'OS' ? 0.15 : 0.10;
    const otherServiceScore = Math.round(otherMonths * otherMonthlyRate * 100) / 100;
    const baseAccessScore = computeAccessScore(person.records || [], prof.code);
    const culturalScore = computeCulturalScore(person.records || [], prof.code);
    const totalScore = Math.round((baseAccessScore + specificServiceScore + otherServiceScore + culturalScore) * 100) / 100;
    return {
      code: prof.code,
      label: PROFILE_LABELS[prof.code] || prof.label,
      baseAccessScore,
      specificServiceScore,
      otherServiceScore,
      culturalScore,
      totalScore,
      serviceDays: specificDays + otherDays,
      specificDays,
    };
  });
}
