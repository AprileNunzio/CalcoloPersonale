export type ServiceSector =
  | 'statale_ata'
  | 'statale_docente'
  | 'paritaria_ata'
  | 'paritaria_docente'
  | 'ente_locale';

export type ServiceContractType =
  | 'annual' // Annuale 31 agosto (12 mesi)
  | 'term' // Termine attività 30 giugno (10 mesi)
  | 'short' // Supplenza breve e saltuaria
  | 'permanent'; // Ruolo / Tempo Indeterminato

export interface ServiceDurationDetails {
  totalDays: number;
  calendarYears: number;
  calendarMonths: number;
  calendarDays: number;
  base30FullMonths: number;
  base30RemainderDays: number;
  scoreMonths: number;
  isRoundedUp: boolean;
}

export interface ServiceDetailCalculation {
  days: number;
  months: number;
  durationDetails: ServiceDurationDetails;
  weeklyHours: number;
  fullTimeHours: number;
  hourRatioPercent: number; // e.g. 100 for 36h, 50 for 18h
  contractType: ServiceContractType;
  validFor24Months: boolean;
  validForAnnualSeniority: boolean; // >= 180 days rule
  scoreSpecificPerMonth: number;
  scoreOtherPerMonth: number;
  totalSpecificScore: number;
  totalOtherScore: number;
  estimatedGrossMonthly: number;
  estimatedContractGrossTotal: number;
  estimatedContractTfr: number;
}

export function calculateDaysBetween(start: string, end: string | null, referenceDate?: Date): number {
  const d1 = new Date(start);
  d1.setHours(0, 0, 0, 0);
  const now = referenceDate ? new Date(referenceDate) : new Date();
  now.setHours(0, 0, 0, 0);
  const d2 = end ? new Date(end) : now;
  d2.setHours(0, 0, 0, 0);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 1;
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateExactCalendarDuration(
  start: string,
  end: string | null,
  referenceDate?: Date
): { years: number; months: number; days: number } {
  const d1 = new Date(start);
  d1.setHours(0, 0, 0, 0);
  const now = referenceDate ? new Date(referenceDate) : new Date();
  now.setHours(0, 0, 0, 0);
  const d2 = end ? new Date(end) : now;
  d2.setHours(0, 0, 0, 0);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) {
    return { years: 0, months: 0, days: 1 };
  }

  const endInclusive = new Date(d2);
  endInclusive.setDate(endInclusive.getDate() + 1);

  let years = endInclusive.getFullYear() - d1.getFullYear();
  let months = endInclusive.getMonth() - d1.getMonth();
  let days = endInclusive.getDate() - d1.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(endInclusive.getFullYear(), endInclusive.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
}

export function calculateServiceDurationDetails(
  start: string,
  end: string | null,
  referenceDate?: Date
): ServiceDurationDetails {
  const totalDays = calculateDaysBetween(start, end, referenceDate);
  const calendar = calculateExactCalendarDuration(start, end, referenceDate);
  const base30FullMonths = Math.floor(totalDays / 30);
  const base30RemainderDays = totalDays % 30;
  const isRoundedUp = base30RemainderDays > 15;
  const scoreMonths = base30FullMonths + (isRoundedUp ? 1 : 0);

  return {
    totalDays,
    calendarYears: calendar.years,
    calendarMonths: calendar.months,
    calendarDays: calendar.days,
    base30FullMonths,
    base30RemainderDays,
    scoreMonths,
    isRoundedUp,
  };
}

export function detectContractTypeFromDates(
  start: string,
  end: string | null,
  isRuolo?: boolean
): ServiceContractType {
  if (isRuolo) return 'permanent';
  if (!end) return 'short';
  if (end.endsWith('08-31')) return 'annual';
  if (end.endsWith('06-30')) return 'term';
  return 'short';
}

export function calculateEquivalentMonths(days: number): number {
  if (days <= 0) return 0;
  const fullMonths = Math.floor(days / 30);
  const remainder = days % 30;
  return fullMonths + (remainder > 15 ? 1 : 0);
}

const PROFILE_BASE_GROSS: Record<string, number> = {
  CS: 1447.00,
  OS: 1501.15,
  AA: 1581.60,
  AT: 1581.60,
  CU: 1581.60,
  GU: 1501.15,
  CR: 1447.00,
  DOCENTE: 1865.70,
};

export function evaluateDetailedService(
  start: string,
  end: string | null,
  sector: ServiceSector,
  targetProfileCode: string,
  weeklyHours?: number,
  contractType?: ServiceContractType
): ServiceDetailCalculation {
  const durationDetails = calculateServiceDurationDetails(start, end);
  const days = durationDetails.totalDays;
  const months = durationDetails.scoreMonths;

  const fullTimeHours = targetProfileCode === 'DOCENTE' ? 18 : 36;
  const actualHours = weeklyHours && weeklyHours > 0 ? weeklyHours : fullTimeHours;
  const hourRatio = Math.min(1, Math.max(0.1, actualHours / fullTimeHours));
  const hourRatioPercent = Math.round(hourRatio * 100);

  // Contract type auto-detection if not specified
  let detectedType: ServiceContractType = contractType || 'term';
  if (!contractType && end) {
    detectedType = detectContractTypeFromDates(start, end);
  }

  let validFor24Months = false;
  let scoreSpecificPerMonth = targetProfileCode === 'CS' || targetProfileCode === 'OS' ? 0.50 : 0.60;
  let scoreOtherPerMonth = targetProfileCode === 'CS' || targetProfileCode === 'OS' ? 0.15 : 0.10;

  if (sector === 'statale_ata') {
    validFor24Months = true;
  } else if (sector === 'statale_docente') {
    validFor24Months = false;
    scoreSpecificPerMonth = 0.10;
    scoreOtherPerMonth = 0.10;
  } else if (sector === 'paritaria_ata') {
    validFor24Months = false;
    scoreSpecificPerMonth = scoreSpecificPerMonth * 0.5;
    scoreOtherPerMonth = scoreOtherPerMonth * 0.5;
  } else if (sector === 'paritaria_docente') {
    validFor24Months = false;
    scoreSpecificPerMonth = 0.05;
    scoreOtherPerMonth = 0.05;
  } else if (sector === 'ente_locale') {
    // Servizio asilo nido comunale: equiparato per CS sotto art. 58 comma 5
    validFor24Months = targetProfileCode === 'CS';
    scoreSpecificPerMonth = scoreSpecificPerMonth * 0.5;
    scoreOtherPerMonth = scoreOtherPerMonth * 0.5;
  }

  // Under Italian ATA regulations (D.M. 89/2024 art. 2), part-time service gets FULL score points!
  const totalSpecificScore = Math.round(months * scoreSpecificPerMonth * 100) / 100;
  const totalOtherScore = Math.round(months * scoreOtherPerMonth * 100) / 100;

  // Seniority rule: >= 180 days in a school year counts as an entire school year (D.Lgs. 297/94)
  const validForAnnualSeniority = days >= 180;

  // Economic calculation based on weekly hours
  const baseRate = PROFILE_BASE_GROSS[targetProfileCode] || PROFILE_BASE_GROSS.CS;
  const estimatedGrossMonthly = Math.round(baseRate * hourRatio * 100) / 100;
  const effectiveMonths = Math.max(1, Math.round(days / 30));
  const estimatedContractGrossTotal = Math.round(estimatedGrossMonthly * effectiveMonths * 100) / 100;
  const estimatedContractTfr = Math.round((estimatedContractGrossTotal / 13.5) * 0.81 * 100) / 100;

  return {
    days,
    months,
    durationDetails,
    weeklyHours: actualHours,
    fullTimeHours,
    hourRatioPercent,
    contractType: detectedType,
    validFor24Months,
    validForAnnualSeniority,
    scoreSpecificPerMonth,
    scoreOtherPerMonth,
    totalSpecificScore,
    totalOtherScore,
    estimatedGrossMonthly,
    estimatedContractGrossTotal,
    estimatedContractTfr,
  };
}

// Backward compatibility wrapper
export function evaluateServiceDuration(
  start: string,
  end: string | null,
  sector: ServiceSector,
  targetProfileCode: string
) {
  const res = evaluateDetailedService(start, end, sector, targetProfileCode);
  return {
    days: res.days,
    months: res.months,
    validFor24Months: res.validFor24Months,
    scoreSpecificPerMonth: res.scoreSpecificPerMonth,
    scoreOtherPerMonth: res.scoreOtherPerMonth,
    totalSpecificScore: res.totalSpecificScore,
    totalOtherScore: res.totalOtherScore,
    sectorLabelKey: sector,
  };
}
