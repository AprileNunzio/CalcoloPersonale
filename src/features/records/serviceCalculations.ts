export type ServiceSector =
  | 'statale_ata'
  | 'statale_docente'
  | 'paritaria_ata'
  | 'paritaria_docente';

export interface ServiceDurationCalculation {
  days: number;
  months: number;
  validFor24Months: boolean;
  scoreSpecificPerMonth: number;
  scoreOtherPerMonth: number;
  totalSpecificScore: number;
  totalOtherScore: number;
  sectorLabelKey: string;
}

export function calculateDaysBetween(start: string, end: string | null): number {
  const d1 = new Date(start);
  const d2 = end ? new Date(end) : new Date(start);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 1;
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateEquivalentMonths(days: number): number {
  if (days <= 0) return 0;
  const fullMonths = Math.floor(days / 30);
  const remainder = days % 30;
  return fullMonths + (remainder > 15 ? 1 : 0);
}

export function evaluateServiceDuration(
  start: string,
  end: string | null,
  sector: ServiceSector,
  targetProfileCode: string,
): ServiceDurationCalculation {
  const days = calculateDaysBetween(start, end);
  const months = calculateEquivalentMonths(days);

  let validFor24Months = false;
  let scoreSpecificPerMonth = 0.50;
  let scoreOtherPerMonth = targetProfileCode === 'CS' || targetProfileCode === 'OS' ? 0.15 : 0.10;
  let sectorLabelKey = 'sectorStataleAta';

  if (sector === 'statale_ata') {
    validFor24Months = true;
    scoreSpecificPerMonth = 0.50;
    scoreOtherPerMonth = targetProfileCode === 'CS' || targetProfileCode === 'OS' ? 0.15 : 0.10;
    sectorLabelKey = 'sectorStataleAta';
  } else if (sector === 'statale_docente') {
    validFor24Months = false;
    scoreSpecificPerMonth = 0.10;
    scoreOtherPerMonth = 0.10;
    sectorLabelKey = 'sectorStataleDocente';
  } else if (sector === 'paritaria_ata') {
    validFor24Months = false;
    scoreSpecificPerMonth = 0.25;
    scoreOtherPerMonth = targetProfileCode === 'CS' || targetProfileCode === 'OS' ? 0.075 : 0.05;
    sectorLabelKey = 'sectorParitariaAta';
  } else if (sector === 'paritaria_docente') {
    validFor24Months = false;
    scoreSpecificPerMonth = 0.05;
    scoreOtherPerMonth = 0.05;
    sectorLabelKey = 'sectorParitariaDocente';
  }

  const totalSpecificScore = Math.round(months * scoreSpecificPerMonth * 100) / 100;
  const totalOtherScore = Math.round(months * scoreOtherPerMonth * 100) / 100;

  return {
    days,
    months,
    validFor24Months,
    scoreSpecificPerMonth,
    scoreOtherPerMonth,
    totalSpecificScore,
    totalOtherScore,
    sectorLabelKey,
  };
}
