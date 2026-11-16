import { Person, Entry } from './types';
import { ProfileScore } from './scoring';

export interface FirstTierEligibility {
  profileCode: string;
  specificDays: number;
  otherAtaDays: number;
  docenteDays: number;
  totalDays: number;
  targetDays: number;
  percentCompleted: number;
  remainingDays: number;
  remainingMonths: number;
  isEligible: boolean;
  projectedWindow: string;
}

export interface CallOddsResult {
  profileCode: string;
  score: number;
  band: 'high' | 'medium' | 'low';
  percentEstimate: number;
  estimatedCallTypeKey: string;
  strategicAdviceKey: string;
}

export interface ProfileCareerIntelligence {
  profileCode: string;
  firstTier: FirstTierEligibility;
  callOdds: CallOddsResult;
}

const STATUTORY_TARGET_DAYS = 706;

function calculateDaysBetween(start: string, end: string | null): number {
  const d1 = new Date(start);
  const d2 = end ? new Date(end) : new Date(start);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 1;
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function extractProvince(person: Person): string | null {
  const records = person.records || [];
  for (const r of records) {
    if (r.kind === 'application' && r.notes) {
      try {
        if (r.notes.startsWith('{')) {
          const parsed = JSON.parse(r.notes);
          if (parsed.province) return parsed.province.trim().toUpperCase();
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

const HIGH_DEMAND_PROVINCES = [
  'MI', 'MB', 'BG', 'BS', 'VA', 'CO', 'LC', 'LO', 'CR', 'PV', 'MN',
  'TO', 'VC', 'NO', 'CN', 'AT', 'AL', 'BI', 'VB',
  'VR', 'VI', 'BL', 'TV', 'VE', 'PD', 'RO',
  'BO', 'MO', 'RE', 'PR', 'PC', 'RA', 'FC', 'RN', 'FE',
  'FI', 'PO', 'PT', 'AR', 'SI', 'LI', 'LU', 'PI', 'GR', 'MS',
  'GE', 'SV', 'IM', 'SP',
  'TS', 'GO', 'UD', 'PN',
];

const HIGH_SATURATION_PROVINCES = [
  'NA', 'CE', 'SA', 'AV', 'BN',
  'CS', 'RC', 'CZ', 'KR', 'VV',
  'PA', 'CT', 'ME', 'AG', 'TP', 'SR', 'CL', 'RG', 'EN',
  'BA', 'LE', 'TA', 'FG', 'BT', 'BR',
];

export function computeFirstTierEligibility(
  person: Person,
  profileCode: string,
): FirstTierEligibility {
  const services = (person.records || []).filter(r => r.kind === 'service');

  let specificDays = 0;
  let otherAtaDays = 0;
  let docenteDays = 0;

  for (const s of services) {
    const isParitaria = (s.title + ' ' + (s.notes || '')).toLowerCase().includes('paritaria');
    if (isParitaria) continue;

    const days = calculateDaysBetween(s.start, s.end);
    const isDocente =
      s.profile === 'DOCENTE' ||
      (s.title + ' ' + (s.notes || '')).toLowerCase().includes('docente') ||
      (s.title + ' ' + (s.notes || '')).toLowerCase().includes('insegnante');

    if (isDocente) {
      docenteDays += days;
      continue;
    }

    if (s.profile === profileCode) {
      specificDays += days;
    } else {
      otherAtaDays += days;
    }
  }

  const totalDays = specificDays + otherAtaDays;
  const isEligible = totalDays >= STATUTORY_TARGET_DAYS;
  const remainingDays = Math.max(0, STATUTORY_TARGET_DAYS - totalDays);
  const remainingMonths = Math.ceil(remainingDays / 30);
  const percentCompleted = Math.min(100, Math.round((totalDays / STATUTORY_TARGET_DAYS) * 100));

  const currentYear = new Date().getFullYear();
  let projectedWindow = '';
  if (isEligible) {
    projectedWindow = `Bando 24 Mesi Primavera ${currentYear + 1}`;
  } else if (remainingDays <= 180) {
    projectedWindow = `Primavera ${currentYear + 1} (con contratto in corso)`;
  } else {
    const yearsNeeded = Math.ceil(remainingDays / 270);
    projectedWindow = `Primavera ${currentYear + yearsNeeded}`;
  }

  return {
    profileCode,
    specificDays,
    otherAtaDays,
    docenteDays,
    totalDays,
    targetDays: STATUTORY_TARGET_DAYS,
    percentCompleted,
    remainingDays,
    remainingMonths,
    isEligible,
    projectedWindow,
  };
}

export function computeCallOdds(
  person: Person,
  scoreItem: ProfileScore,
): CallOddsResult {
  const province = extractProvince(person);
  let thresholdHigh = 11.0;
  let thresholdMedium = 8.5;

  if (scoreItem.code === 'AA') {
    thresholdHigh = 12.0;
    thresholdMedium = 9.0;
  } else if (scoreItem.code === 'CS') {
    thresholdHigh = 10.5;
    thresholdMedium = 8.0;
  } else if (scoreItem.code === 'AT') {
    thresholdHigh = 11.5;
    thresholdMedium = 8.5;
  } else if (scoreItem.code === 'OS') {
    thresholdHigh = 9.5;
    thresholdMedium = 7.5;
  }

  if (province) {
    if (HIGH_DEMAND_PROVINCES.includes(province)) {
      thresholdHigh = Math.max(6.0, thresholdHigh - 1.5);
      thresholdMedium = Math.max(5.0, thresholdMedium - 1.2);
    } else if (HIGH_SATURATION_PROVINCES.includes(province)) {
      thresholdHigh += 2.0;
      thresholdMedium += 1.5;
    }
  }

  const score = scoreItem.totalScore;
  let band: 'high' | 'medium' | 'low';
  let percentEstimate = 50;
  let estimatedCallTypeKey = 'callAnnualOrLong';
  let strategicAdviceKey = 'adviceMaintainStatus';

  if (score >= thresholdHigh) {
    band = 'high';
    const excess = Math.min(10, score - thresholdHigh);
    percentEstimate = Math.min(96, Math.round(80 + (excess / 10) * 16));
    estimatedCallTypeKey = 'callAnnualOrLong';
    strategicAdviceKey = 'adviceHighPositioning';
  } else if (score >= thresholdMedium) {
    band = 'medium';
    const range = thresholdHigh - thresholdMedium;
    const progress = (score - thresholdMedium) / Math.max(0.1, range);
    percentEstimate = Math.min(79, Math.max(45, Math.round(45 + progress * 34)));
    estimatedCallTypeKey = 'callShortOrTemporary';
    strategicAdviceKey = 'adviceMediumPositioning';
  } else {
    band = 'low';
    const deficit = Math.max(0, thresholdMedium - score);
    percentEstimate = Math.max(15, Math.round(40 - Math.min(25, deficit * 6)));
    estimatedCallTypeKey = 'callOccasional';
    strategicAdviceKey = 'adviceLowPositioning';
  }

  return {
    profileCode: scoreItem.code,
    score,
    band,
    percentEstimate,
    estimatedCallTypeKey,
    strategicAdviceKey,
  };
}

export function computeCareerIntelligence(
  person: Person,
  profileScores: ProfileScore[],
): ProfileCareerIntelligence[] {
  return profileScores.map(scoreItem => ({
    profileCode: scoreItem.code,
    firstTier: computeFirstTierEligibility(person, scoreItem.code),
    callOdds: computeCallOdds(person, scoreItem),
  }));
}
