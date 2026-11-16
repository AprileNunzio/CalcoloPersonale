import { Person, Entry } from './types';
import { ATA_PROFILES, PROFILE_LABELS } from './personUtils';

export type MinisterialDecree = 'DM_89_2024' | 'DM_50_2021' | 'DM_640_2017';

export interface SchoolYearServiceBreakdown {
  schoolYear: string;
  startYear: number;
  endYear: number;
  days: number;
  months: number;
  specificScore: number;
  otherScore: number;
  totalAnnualScore: number;
  isCapped: boolean;
  cappedScore: number;
}

export interface ScoreValidationData {
  profileCode: string;
  isConvalidated: boolean;
  validatedScore: number;
  useValidatedScore: boolean;
  decreeProtocol: string;
  decreeDate: string;
  validatingSchool: string;
  notes?: string;
  lastUpdated?: string;
}

export interface ProfileScore {
  code: string;
  label: string;
  baseAccessScore: number;
  specificServiceScore: number;
  otherServiceScore: number;
  culturalScore: number;
  totalScore: number; // calculated according to the selected decree
  serviceDays: number;
  specificDays: number;
  decree: MinisterialDecree;
  // Convalidation metadata:
  isConvalidated: boolean;
  useValidatedScore: boolean;
  validatedScore?: number;
  effectiveScore: number; // official score used across the app
  validationDecree?: string;
  validatingSchool?: string;
  validationDate?: string;
  schoolYearBreakdown: SchoolYearServiceBreakdown[];
}

export function parseDays(start: string, end: string | null): number {
  const dStart = new Date(start);
  const dEnd = end ? new Date(end) : new Date(start);
  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()) || dEnd < dStart) return 1;
  const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateMonths(days: number): number {
  if (days <= 0) return 0;
  const fullMonths = Math.floor(days / 30);
  const remainder = days % 30;
  return fullMonths + (remainder > 15 ? 1 : 0);
}

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

function computeAccessScore(records: Entry[], profileCode: string): number {
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

function computeCulturalScore(
  records: Entry[],
  profileCode: string,
  decree: MinisterialDecree,
  accessQualId?: string
): number {
  let score = 0;
  const quals = (records || []).filter(r => r.kind === 'qualification' && r.id !== accessQualId);

  // Digital Literacy / CIAD
  const hasDigital = quals.some(q => {
    const t = (q.title + ' ' + (q.notes || '')).toLowerCase();
    return (
      t.includes('alfabetizzazione') ||
      t.includes('ciad') ||
      t.includes('ecdl') ||
      t.includes('eipass') ||
      t.includes('digcomp') ||
      t.includes('informatica')
    );
  });

  if (hasDigital) {
    // Under D.M. 89/2024 CIAD is an access requirement for AA/AT/OS (and deroga 1 yr for CS).
    // As cultural points under ministerial tables, max 1 digital title evaluates:
    score += profileCode === 'CS' ? 0.30 : 0.60;
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
    // OSS or OSA gives 1.0 point under DM 89/2024 Table A/5
    if (decree === 'DM_89_2024' && quals.some(q => {
      const t = q.title.toLowerCase();
      return t.includes('oss') || t.includes('osa') || t.includes('socio');
    })) {
      score += 1.0;
    }
  }

  return Math.round(score * 100) / 100;
}

export function extractScoreValidations(person: Person): Record<string, ScoreValidationData> {
  const map: Record<string, ScoreValidationData> = {};
  const records = person.records || [];

  for (const r of records) {
    if (r.kind === 'validation' || r.kind === 'application') {
      try {
        if (r.notes && r.notes.startsWith('{')) {
          const parsed = JSON.parse(r.notes);
          if (parsed.validations && typeof parsed.validations === 'object') {
            for (const [code, val] of Object.entries(parsed.validations)) {
              if (val && typeof val === 'object') {
                map[code] = val as ScoreValidationData;
              }
            }
          }
          if (parsed.validationData && parsed.validationData.profileCode) {
            map[parsed.validationData.profileCode] = parsed.validationData;
          }
        }
      } catch {
        // ignore malformed notes
      }
    }
  }

  return map;
}

/**
 * Splits a date range across Italian school years (1 September to 31 August).
 */
function splitServiceBySchoolYears(startStr: string, endStr: string | null) {
  const results: { schoolYear: string; startYear: number; endYear: number; days: number }[] = [];
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date(startStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    const yr = start.getFullYear() || 2024;
    return [{ schoolYear: `${yr}/${yr + 1}`, startYear: yr, endYear: yr + 1, days: 1 }];
  }

  let curr = new Date(start);
  while (curr <= end) {
    const yr = curr.getFullYear();
    const m = curr.getMonth(); // 0-indexed: 8 is September
    const syStartYear = m >= 8 ? yr : yr - 1;
    const syEndYear = syStartYear + 1;
    const syEnd = new Date(syEndYear, 7, 31, 23, 59, 59); // 31 August

    const segmentEnd = end < syEnd ? end : syEnd;
    const diff = Math.ceil(Math.abs(segmentEnd.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const syLabel = `${syStartYear}/${syEndYear}`;

    results.push({ schoolYear: syLabel, startYear: syStartYear, endYear: syEndYear, days: Math.max(1, diff) });

    curr = new Date(syEndYear, 8, 1); // 1 September
  }

  return results;
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

export function calculateProfileScores(
  person: Person,
  onlyActive = true,
  decree: MinisterialDecree = 'DM_89_2024'
): ProfileScore[] {
  const activeCodes = getActiveProfiles(person);
  if (onlyActive && activeCodes.length === 0) {
    return [];
  }
  const profilesToEvaluate = onlyActive
    ? ATA_PROFILES.filter(p => activeCodes.includes(p.code))
    : ATA_PROFILES;

  const validationsMap = extractScoreValidations(person);
  const services = (person.records || []).filter(r => r.kind === 'service');

  return profilesToEvaluate.map(prof => {
    const syMap = new Map<string, { days: number; specificScore: number; otherScore: number; startYear: number; endYear: number }>();
    let totalSpecificDays = 0;
    let totalOtherDays = 0;

    for (const s of services) {
      const isParitaria = (s.title + ' ' + (s.notes || '')).toLowerCase().includes('paritaria');
      const isDocente =
        s.profile === 'DOCENTE' || (s.title + ' ' + (s.notes || '')).toLowerCase().includes('docente');
      const mult = isParitaria ? 0.5 : 1.0;
      const isSpecific = !isDocente && s.profile === prof.code;

      const segments = splitServiceBySchoolYears(s.start, s.end);
      for (const seg of segments) {
        if (!syMap.has(seg.schoolYear)) {
          syMap.set(seg.schoolYear, {
            days: 0,
            specificScore: 0,
            otherScore: 0,
            startYear: seg.startYear,
            endYear: seg.endYear,
          });
        }
        const item = syMap.get(seg.schoolYear)!;
        item.days += seg.days;

        if (isSpecific) {
          totalSpecificDays += seg.days;
          const rate = (prof.code === 'CS' || prof.code === 'OS' ? 0.50 : 0.60) * mult;
          const months = calculateMonths(seg.days);
          item.specificScore += months * rate;
        } else {
          totalOtherDays += seg.days;
          const rate = (prof.code === 'CS' || prof.code === 'OS' ? 0.15 : 0.10) * mult;
          const months = calculateMonths(seg.days);
          item.otherScore += months * rate;
        }
      }
    }

    // Process school year breakdowns and apply the statutory 6.00 points annual ceiling
    const schoolYearBreakdown: SchoolYearServiceBreakdown[] = [];
    let aggregatedSpecific = 0;
    let aggregatedOther = 0;

    const sortedSchoolYears = Array.from(syMap.entries()).sort(
      (a, b) => b[1].startYear - a[1].startYear
    );

    for (const [sy, data] of sortedSchoolYears) {
      const months = calculateMonths(data.days);
      const rawTotal = data.specificScore + data.otherScore;
      const isCapped = rawTotal > 6.00;
      const cappedTotal = isCapped ? 6.00 : rawTotal;

      if (isCapped) {
        const ratio = data.specificScore / (rawTotal || 1);
        aggregatedSpecific += Math.round(cappedTotal * ratio * 100) / 100;
        aggregatedOther += Math.round(cappedTotal * (1 - ratio) * 100) / 100;
      } else {
        aggregatedSpecific += Math.round(data.specificScore * 100) / 100;
        aggregatedOther += Math.round(data.otherScore * 100) / 100;
      }

      schoolYearBreakdown.push({
        schoolYear: sy,
        startYear: data.startYear,
        endYear: data.endYear,
        days: data.days,
        months,
        specificScore: Math.round(data.specificScore * 100) / 100,
        otherScore: Math.round(data.otherScore * 100) / 100,
        totalAnnualScore: Math.round(rawTotal * 100) / 100,
        isCapped,
        cappedScore: Math.round(cappedTotal * 100) / 100,
      });
    }

    const accessQual = extractAccessQualification(person.records || [], prof.code);
    const baseAccessScore = computeAccessScore(person.records || [], prof.code);
    const culturalScore = computeCulturalScore(person.records || [], prof.code, decree, accessQual?.id);
    const calculatedTotalScore = Math.round(
      (baseAccessScore + aggregatedSpecific + aggregatedOther + culturalScore) * 100
    ) / 100;

    // Check school validation decree
    const validation = validationsMap[prof.code];
    const isConvalidated = Boolean(validation?.isConvalidated);
    const useValidatedScore = Boolean(validation?.useValidatedScore && isConvalidated);
    const validatedScore = validation?.validatedScore;
    const effectiveScore = useValidatedScore && typeof validatedScore === 'number'
      ? validatedScore
      : calculatedTotalScore;

    return {
      code: prof.code,
      label: PROFILE_LABELS[prof.code] || prof.label,
      baseAccessScore,
      specificServiceScore: Math.round(aggregatedSpecific * 100) / 100,
      otherServiceScore: Math.round(aggregatedOther * 100) / 100,
      culturalScore,
      totalScore: calculatedTotalScore,
      serviceDays: totalSpecificDays + totalOtherDays,
      specificDays: totalSpecificDays,
      decree,
      isConvalidated,
      useValidatedScore,
      validatedScore,
      effectiveScore: Math.round(effectiveScore * 100) / 100,
      validationDecree: validation?.decreeProtocol,
      validatingSchool: validation?.validatingSchool,
      validationDate: validation?.decreeDate,
      schoolYearBreakdown,
    };
  });
}
