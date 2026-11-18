import { Entry } from '../../shared/types';
import { CCNL_TABLES, FASCIA_LIMITS, SalaryFascia } from './salaryTables';

export interface CareerSeniorityResult {
  totalServiceDays: number;
  recognizedYears: number;
  recognizedMonths: number;
  recognizedDays: number;
  fullSchoolYearsCount: number;
  currentFascia: SalaryFascia;
  nextFascia: SalaryFascia | null;
  yearsRemainingToNext: number;
  monthsRemainingToNext: number;
  progressPercent: number;
  monthlyGrossIncreaseOnNext: number;
  autoDetectedFromRecords: boolean;
}

export function calculateCareerSeniority(records: Entry[], profile = 'CS'): CareerSeniorityResult {
  const serviceRecords = (records || []).filter(r => r.kind === 'service' && r.start);
  if (serviceRecords.length === 0) {
    return {
      totalServiceDays: 0,
      recognizedYears: 0,
      recognizedMonths: 0,
      recognizedDays: 0,
      fullSchoolYearsCount: 0,
      currentFascia: '0-8',
      nextFascia: '9-14',
      yearsRemainingToNext: 9,
      monthsRemainingToNext: 0,
      progressPercent: 0,
      monthlyGrossIncreaseOnNext: (CCNL_TABLES[profile]?.['9-14'] ?? 1472.30) - (CCNL_TABLES[profile]?.['0-8'] ?? 1358.50),
      autoDetectedFromRecords: false,
    };
  }

  let totalDays = 0;
  const syDaysMap = new Map<string, number>();

  for (const s of serviceRecords) {
    const start = new Date(s.start);
    const end = s.end ? new Date(s.end) : new Date(s.start);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) continue;

    const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDays += diff;

    const m = start.getMonth();
    const syStart = m >= 8 ? start.getFullYear() : start.getFullYear() - 1;
    const syKey = `${syStart}/${syStart + 1}`;
    syDaysMap.set(syKey, (syDaysMap.get(syKey) || 0) + diff);
  }

  let fullSchoolYearsCount = 0;
  syDaysMap.forEach(days => {
    if (days >= 180) fullSchoolYearsCount++;
  });

  const recognizedYears = Math.floor(totalDays / 360);
  const remDays = totalDays % 360;
  const recognizedMonths = Math.floor(remDays / 30);
  const recognizedDays = remDays % 30;

  let currentFascia: SalaryFascia = '0-8';
  let nextFascia: SalaryFascia | null = '9-14';
  let minYears = 0;
  let maxYears = 8;

  for (let i = 0; i < FASCIA_LIMITS.length; i++) {
    const f = FASCIA_LIMITS[i];
    if (recognizedYears >= f.minYears && recognizedYears <= f.maxYears) {
      currentFascia = f.fascia;
      minYears = f.minYears;
      maxYears = f.maxYears;
      nextFascia = i < FASCIA_LIMITS.length - 1 ? FASCIA_LIMITS[i + 1].fascia : null;
      break;
    }
  }

  let yearsRemainingToNext = 0;
  let monthsRemainingToNext = 0;
  let progressPercent = 0;

  if (nextFascia) {
    const targetYears = maxYears + 1;
    const totalCurrentMonths = recognizedYears * 12 + recognizedMonths;
    const targetMonths = targetYears * 12;
    const diffMonths = Math.max(0, targetMonths - totalCurrentMonths);

    yearsRemainingToNext = Math.floor(diffMonths / 12);
    monthsRemainingToNext = diffMonths % 12;

    const spanMonths = (maxYears - minYears + 1) * 12;
    const completedInSpan = (recognizedYears - minYears) * 12 + recognizedMonths;
    progressPercent = Math.min(100, Math.max(0, Math.round((completedInSpan / spanMonths) * 100)));
  } else {
    progressPercent = 100;
  }

  const pKey = profile in CCNL_TABLES ? profile : 'CS';
  const currSalary = CCNL_TABLES[pKey][currentFascia];
  const nextSalary = nextFascia ? CCNL_TABLES[pKey][nextFascia] : currSalary;
  const monthlyGrossIncreaseOnNext = Math.round((nextSalary - currSalary) * 100) / 100;

  return {
    totalServiceDays: totalDays,
    recognizedYears,
    recognizedMonths,
    recognizedDays,
    fullSchoolYearsCount,
    currentFascia,
    nextFascia,
    yearsRemainingToNext,
    monthsRemainingToNext,
    progressPercent,
    monthlyGrossIncreaseOnNext,
    autoDetectedFromRecords: true,
  };
}
