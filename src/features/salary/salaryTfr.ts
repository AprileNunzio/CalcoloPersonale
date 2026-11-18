import { Entry } from '../../shared/types';
import { CCNL_TABLES, CIA_IVC_TABLE } from './salaryTables';

export interface TfrYearContractBreakdown {
  id: string;
  periodLabel: string;
  schoolYear: string;
  monthsCount: number;
  grossUsefulSalary: number;
  tfrGross: number;
  tfrNetEstimated: number;
}

export interface CumulativeTfrResult {
  totalGrossTfr: number;
  totalNetTfr: number;
  contractsCount: number;
  items: TfrYearContractBreakdown[];
}

export function calculateTfrHistory(records: Entry[], currentProfile = 'CS'): CumulativeTfrResult {
  const serviceRecords = (records || []).filter(r => r.kind === 'service' && r.start);
  if (serviceRecords.length === 0) {
    return { totalGrossTfr: 0, totalNetTfr: 0, contractsCount: 0, items: [] };
  }

  const pKey = currentProfile in CCNL_TABLES ? currentProfile : 'CS';
  const baseRate = CCNL_TABLES[pKey]['0-8'];
  const cia = CIA_IVC_TABLE[pKey]?.cia || 79.40;
  const ivc = CIA_IVC_TABLE[pKey]?.ivc || 9.10;
  const fullMonthlyGross = baseRate + cia + ivc;

  const items: TfrYearContractBreakdown[] = [];
  let totalGrossTfr = 0;

  for (const s of serviceRecords) {
    const start = new Date(s.start);
    const end = s.end ? new Date(s.end) : new Date(s.start);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) continue;

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const fullMonths = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;
    const monthsCount = Math.max(1, fullMonths + (remDays >= 15 ? 1 : 0));

    const grossUsefulSalary = Math.round(fullMonthlyGross * monthsCount * 100) / 100;
    const tfrGross = Math.round((grossUsefulSalary / 13.5) * 100) / 100;
    const tfrNetEstimated = Math.round(tfrGross * 0.81 * 100) / 100;

    const syStart = start.getMonth() >= 8 ? start.getFullYear() : start.getFullYear() - 1;
    const schoolYear = `${syStart}/${syStart + 1}`;

    totalGrossTfr += tfrGross;

    items.push({
      id: s.id,
      periodLabel: `${s.start} - ${s.end || 'in corso'}`,
      schoolYear,
      monthsCount,
      grossUsefulSalary,
      tfrGross,
      tfrNetEstimated,
    });
  }

  totalGrossTfr = Math.round(totalGrossTfr * 100) / 100;
  const totalNetTfr = Math.round(totalGrossTfr * 0.81 * 100) / 100;

  return {
    totalGrossTfr,
    totalNetTfr,
    contractsCount: items.length,
    items,
  };
}
