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
  return 6.0;
}

function computeAccessScore(records: Entry[], profileCode: string): number {
  const qual = records.find(
    r => r.kind === 'qualification' && (r.profile === profileCode || !r.profile) && r.amount,
  );
  if (qual && qual.amount) {
    return normalizeGrade(qual.amount);
  }
  return 6.0;
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

export function calculateProfileScores(person: Person): ProfileScore[] {
  const services = (person.records || []).filter(r => r.kind === 'service');
  return ATA_PROFILES.map(prof => {
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
