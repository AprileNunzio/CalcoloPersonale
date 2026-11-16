import { Entry } from '../../shared/types';

export type SalaryFascia = '0-8' | '9-14' | '15-20' | '21-27' | '28-34' | '35+';

export interface SalarySimulationParams {
  profile: string; // 'CS' | 'AA' | 'AT' | 'OS' | 'CU' | 'GU' | 'CR' | 'DOCENTE'
  weeklyHours: number; // 6 to 36 (default 36)
  contractType: 'annual' | 'term' | 'short'; // annual: 31/08, term: 30/06, short: supplenza breve
  monthsWorkedInYear: number; // 1 to 12
  dependentChildrenCount: number;
  sicknessDaysInMonth: number;
  strikeDaysInMonth: number;
  regionalTaxRatePercent: number; // default 1.73%
  municipalTaxRatePercent: number; // default 0.8%
  overrideFascia?: SalaryFascia;
}

export interface CareerSeniorityResult {
  totalServiceDays: number;
  recognizedYears: number;
  recognizedMonths: number;
  recognizedDays: number;
  fullSchoolYearsCount: number; // school years with >= 180 days
  currentFascia: SalaryFascia;
  nextFascia: SalaryFascia | null;
  yearsRemainingToNext: number;
  monthsRemainingToNext: number;
  progressPercent: number; // 0 to 100 within current bracket
  monthlyGrossIncreaseOnNext: number;
  autoDetectedFromRecords: boolean;
}

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

export interface SalaryBreakdownResult {
  monthlyGross: number;
  baseSalary: number;
  ciaOrRpd: number;
  ivc: number;
  fascia: SalaryFascia;
  sicknessDeductions: number;
  strikeDeductions: number;
  effectiveGross: number;
  inpsPensionContribution: number;
  taxableIncomeIrpef: number;
  irpefGross: number;
  employmentTaxCredit: number;
  irpefNet: number;
  regionalTax: number;
  municipalTax: number;
  cuneoTaxRelief: number;
  monthlyNetSalary: number;
  estimatedAuuMonthly: number;
  totalMonthlyNetWithAuu: number;
  tfrYearlyEstimated: number;
  hourlyRateNet: number;
}

// Tabelle tabellari CCNL Comparto Istruzione e Ricerca 18/01/2024 per Fascia Stipendiale (Lordi mensili per 36 ore)
const CCNL_TABLES: Record<string, Record<SalaryFascia, number>> = {
  CS: {
    '0-8': 1358.50,
    '9-14': 1472.30,
    '15-20': 1558.10,
    '21-27': 1642.80,
    '28-34': 1714.60,
    '35+': 1761.90,
  },
  OS: {
    '0-8': 1412.30,
    '9-14': 1538.00,
    '15-20': 1632.00,
    '21-27': 1725.00,
    '28-34': 1802.00,
    '35+': 1854.00,
  },
  AA: {
    '0-8': 1492.20,
    '9-14': 1636.50,
    '15-20': 1751.80,
    '21-27': 1868.10,
    '28-34': 1961.40,
    '35+': 2028.70,
  },
  AT: {
    '0-8': 1492.20,
    '9-14': 1636.50,
    '15-20': 1751.80,
    '21-27': 1868.10,
    '28-34': 1961.40,
    '35+': 2028.70,
  },
  CU: {
    '0-8': 1492.20,
    '9-14': 1636.50,
    '15-20': 1751.80,
    '21-27': 1868.10,
    '28-34': 1961.40,
    '35+': 2028.70,
  },
  GU: {
    '0-8': 1412.30,
    '9-14': 1538.00,
    '15-20': 1632.00,
    '21-27': 1725.00,
    '28-34': 1802.00,
    '35+': 1854.00,
  },
  CR: {
    '0-8': 1358.50,
    '9-14': 1472.30,
    '15-20': 1558.10,
    '21-27': 1642.80,
    '28-34': 1714.60,
    '35+': 1761.90,
  },
  DOCENTE: {
    '0-8': 1680.00,
    '9-14': 1890.00,
    '15-20': 2080.00,
    '21-27': 2260.00,
    '28-34': 2410.00,
    '35+': 2530.00,
  },
};

const CIA_IVC_TABLE: Record<string, { cia: number; ivc: number }> = {
  CS: { cia: 79.40, ivc: 9.10 },
  OS: { cia: 79.40, ivc: 9.45 },
  AA: { cia: 79.40, ivc: 10.00 },
  AT: { cia: 79.40, ivc: 10.00 },
  CU: { cia: 79.40, ivc: 10.00 },
  GU: { cia: 79.40, ivc: 9.45 },
  CR: { cia: 79.40, ivc: 9.10 },
  DOCENTE: { cia: 174.50, ivc: 11.20 },
};

export const FASCIA_LIMITS: { fascia: SalaryFascia; minYears: number; maxYears: number }[] = [
  { fascia: '0-8', minYears: 0, maxYears: 8 },
  { fascia: '9-14', minYears: 9, maxYears: 14 },
  { fascia: '15-20', minYears: 15, maxYears: 20 },
  { fascia: '21-27', minYears: 21, maxYears: 27 },
  { fascia: '28-34', minYears: 28, maxYears: 34 },
  { fascia: '35+', minYears: 35, maxYears: 99 },
];

/**
 * Calculates career seniority progression based on uploaded service records.
 */
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

    // School year attribution (1 Sept - 31 Aug)
    const m = start.getMonth();
    const syStart = m >= 8 ? start.getFullYear() : start.getFullYear() - 1;
    const syKey = `${syStart}/${syStart + 1}`;
    syDaysMap.set(syKey, (syDaysMap.get(syKey) || 0) + diff);
  }

  // Count full school years (>= 180 days rule ex D.Lgs. 297/94)
  let fullSchoolYearsCount = 0;
  syDaysMap.forEach(days => {
    if (days >= 180) fullSchoolYearsCount++;
  });

  // Calculate recognized years and months (360 days convention for legal school seniority)
  const recognizedYears = Math.floor(totalDays / 360);
  const remDays = totalDays % 360;
  const recognizedMonths = Math.floor(remDays / 30);
  const recognizedDays = remDays % 30;

  // Determine current fascia
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

  // Time remaining to next step
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

/**
 * Calculates historical cumulative TFR for all registered service contracts.
 */
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
    // Italian labor rule: >= 15 days in a month counts as a full month for TFR accrual
    const fullMonths = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;
    const monthsCount = Math.max(1, fullMonths + (remDays >= 15 ? 1 : 0));

    const grossUsefulSalary = Math.round(fullMonthlyGross * monthsCount * 100) / 100;
    // TFR accrual = Useful Salary / 13.5 (under Art. 2120 c.c. / CCNL)
    const tfrGross = Math.round((grossUsefulSalary / 13.5) * 100) / 100;
    // Estimated net after ~19% average IRPEF separate taxation
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

/**
 * Calculates monthly NoiPA salary breakdown for current contract.
 */
export function calculateSalaryBreakdown(params: SalarySimulationParams): SalaryBreakdownResult {
  const profileKey = params.profile in CCNL_TABLES ? params.profile : 'CS';
  const fasciaKey: SalaryFascia = params.overrideFascia || '0-8';

  const baseRate = CCNL_TABLES[profileKey][fasciaKey] || CCNL_TABLES[profileKey]['0-8'];
  const fullTimeHours = profileKey === 'DOCENTE' ? 18 : 36;
  const hourRatio = Math.min(1, Math.max(0.1, params.weeklyHours / fullTimeHours));

  const baseSalary = Number((baseRate * hourRatio).toFixed(2));
  const ciaInfo = CIA_IVC_TABLE[profileKey] || CIA_IVC_TABLE.CS;
  const ciaOrRpd = Number((ciaInfo.cia * hourRatio).toFixed(2));
  const ivc = Number((ciaInfo.ivc * hourRatio).toFixed(2));

  const monthlyGross = Number((baseSalary + ciaOrRpd + ivc).toFixed(2));

  // Trattenute assenze
  const dailyGross = monthlyGross / 30;
  let sicknessDeductions = 0;

  // Primi 10 giorni malattia: trattenuta Brunetta accessorio (~cia/30 al giorno)
  const first10Days = Math.min(10, params.sicknessDaysInMonth);
  sicknessDeductions += first10Days * (ciaOrRpd / 30);

  // Giorni malattia dal 31° al 90°: 50% di decurtazione stipendio
  if (params.sicknessDaysInMonth > 30 && params.sicknessDaysInMonth <= 90) {
    const daysAt50 = params.sicknessDaysInMonth - 30;
    sicknessDeductions += daysAt50 * (dailyGross * 0.50);
  } else if (params.sicknessDaysInMonth > 90) {
    const daysAt50 = 60;
    const daysAtZero = params.sicknessDaysInMonth - 90;
    sicknessDeductions += daysAt50 * (dailyGross * 0.50) + daysAtZero * dailyGross;
  }
  sicknessDeductions = Number(Math.min(monthlyGross, sicknessDeductions).toFixed(2));

  const strikeDeductions = Number(
    Math.min(monthlyGross - sicknessDeductions, params.strikeDaysInMonth * dailyGross).toFixed(2),
  );

  const effectiveGross = Math.max(0, Number((monthlyGross - sicknessDeductions - strikeDeductions).toFixed(2)));

  // Contributi IVS a carico lavoratore (9.15%)
  const inpsPensionContribution = Number((effectiveGross * 0.0915).toFixed(2));

  // Imponibile Fiscale IRPEF
  const taxableIncomeIrpef = Math.max(0, Number((effectiveGross - inpsPensionContribution).toFixed(2)));

  // Proiezione annua scaglioni IRPEF 2024
  const yearlyTaxable = taxableIncomeIrpef * 12;
  let yearlyIrpefGross = 0;
  if (yearlyTaxable <= 28000) {
    yearlyIrpefGross = yearlyTaxable * 0.23;
  } else if (yearlyTaxable <= 50000) {
    yearlyIrpefGross = 28000 * 0.23 + (yearlyTaxable - 28000) * 0.35;
  } else {
    yearlyIrpefGross = 28000 * 0.23 + 22000 * 0.35 + (yearlyTaxable - 50000) * 0.43;
  }

  // Detrazione da lavoro dipendente 2024
  let yearlyEmploymentCredit = 0;
  if (yearlyTaxable <= 15000) {
    yearlyEmploymentCredit = 1955;
  } else if (yearlyTaxable <= 28000) {
    yearlyEmploymentCredit = 1955 * ((28000 - yearlyTaxable) / 13000);
  } else if (yearlyTaxable <= 50000) {
    yearlyEmploymentCredit = 1910 * ((50000 - yearlyTaxable) / 22000);
  }

  const monthlyEmploymentCredit = Number((yearlyEmploymentCredit / 12).toFixed(2));
  const monthlyIrpefGross = Number((yearlyIrpefGross / 12).toFixed(2));
  const irpefNet = Math.max(0, Number((monthlyIrpefGross - monthlyEmploymentCredit).toFixed(2)));

  // Addizionali Regionali e Comunali stimate
  const regionalTax = Number((taxableIncomeIrpef * (params.regionalTaxRatePercent / 100)).toFixed(2));
  const municipalTax = Number((taxableIncomeIrpef * (params.municipalTaxRatePercent / 100)).toFixed(2));

  // Esonero contributivo / Taglio cuneo fiscale (6% o 7%)
  const cuneoTaxRelief = Number(
    (taxableIncomeIrpef <= 2692 ? effectiveGross * (taxableIncomeIrpef <= 1923 ? 0.07 : 0.06) : 0).toFixed(2),
  );

  const monthlyNetSalary = Math.max(
    0,
    Number((effectiveGross - inpsPensionContribution - irpefNet - regionalTax - municipalTax + cuneoTaxRelief).toFixed(2)),
  );

  const estimatedAuuMonthly = Number((params.dependentChildrenCount * 199.40).toFixed(2));
  const totalMonthlyNetWithAuu = Number((monthlyNetSalary + estimatedAuuMonthly).toFixed(2));

  const yearlyUtilitySalary = effectiveGross * Math.max(1, params.monthsWorkedInYear);
  const tfrYearlyEstimated = Number(((yearlyUtilitySalary / 13.5) * 0.81).toFixed(2));

  const monthlyWorkingHours = params.weeklyHours * 4.33;
  const hourlyRateNet = Number((monthlyNetSalary / Math.max(1, monthlyWorkingHours)).toFixed(2));

  return {
    monthlyGross,
    baseSalary,
    ciaOrRpd,
    ivc,
    fascia: fasciaKey,
    sicknessDeductions,
    strikeDeductions,
    effectiveGross,
    inpsPensionContribution,
    taxableIncomeIrpef,
    irpefGross: monthlyIrpefGross,
    employmentTaxCredit: monthlyEmploymentCredit,
    irpefNet,
    regionalTax,
    municipalTax,
    cuneoTaxRelief,
    monthlyNetSalary,
    estimatedAuuMonthly,
    totalMonthlyNetWithAuu,
    tfrYearlyEstimated,
    hourlyRateNet,
  };
}
