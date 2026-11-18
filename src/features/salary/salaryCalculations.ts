import {
  CCNL_TABLES,
  CIA_IVC_TABLE,
  SalaryFascia,
  ContractCategory,
} from './salaryTables';

export * from './salaryTables';
export * from './salarySeniority';
export * from './salaryTfr';

export interface SalarySimulationParams {
  profile: string;
  weeklyHours: number;
  contractType: ContractCategory;
  monthsWorkedInYear: number;
  dependentChildrenCount: number;
  sicknessDaysInMonth: number;
  strikeDaysInMonth: number;
  regionalTaxRatePercent: number;
  municipalTaxRatePercent: number;
  overrideFascia?: SalaryFascia;
}

export interface SalaryBreakdownResult {
  monthlyGross: number;
  baseSalary: number;
  ciaOrRpd: number;
  ivc: number;
  fascia: SalaryFascia;
  contractType: ContractCategory;
  sicknessDeductions: number;
  sicknessRuleApplied: string;
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
  tfrPaymentMode: string;
  hourlyRateNet: number;
  hasNaspiEntitlement: boolean;
  canMonetizeVacation: boolean;
}

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
  const dailyGross = monthlyGross / 30;

  let sicknessDeductions = 0;
  let sicknessRuleApplied = '';

  if (params.contractType === 'short') {
    const cappedDays = Math.min(30, params.sicknessDaysInMonth);
    const excessDays = Math.max(0, params.sicknessDaysInMonth - 30);
    sicknessDeductions = cappedDays * (dailyGross * 0.50) + excessDays * dailyGross;
    sicknessRuleApplied = 'Supplenza breve (Art. 19 c.10): 50% di decurtazione fin dal 1° giorno (max 30 gg/anno); giorni > 30 non retribuiti al 100%.';
  } else if (params.contractType === 'permanent') {
    const first10Days = Math.min(10, params.sicknessDaysInMonth);
    sicknessDeductions += first10Days * (ciaOrRpd / 30);

    if (params.sicknessDaysInMonth > 270 && params.sicknessDaysInMonth <= 360) {
      const daysAt10 = params.sicknessDaysInMonth - 270;
      sicknessDeductions += daysAt10 * (dailyGross * 0.10);
    } else if (params.sicknessDaysInMonth > 360 && params.sicknessDaysInMonth <= 540) {
      const daysAt10 = 90;
      const daysAt50 = params.sicknessDaysInMonth - 360;
      sicknessDeductions += daysAt10 * (dailyGross * 0.10) + daysAt50 * (dailyGross * 0.50);
    } else if (params.sicknessDaysInMonth > 540) {
      const daysAt10 = 90;
      const daysAt50 = 180;
      const daysAtZero = params.sicknessDaysInMonth - 540;
      sicknessDeductions += daysAt10 * (dailyGross * 0.10) + daysAt50 * (dailyGross * 0.50) + daysAtZero * dailyGross;
    }
    sicknessRuleApplied = 'Ruolo (Art. 17): comporto 18 mesi (9 mesi 100%, 3 mesi 90%, 6 mesi 50%); Brunetta CIA nei primi 10 gg.';
  } else {
    const first10Days = Math.min(10, params.sicknessDaysInMonth);
    sicknessDeductions += first10Days * (ciaOrRpd / 30);

    if (params.sicknessDaysInMonth > 30 && params.sicknessDaysInMonth <= 90) {
      const daysAt50 = params.sicknessDaysInMonth - 30;
      sicknessDeductions += daysAt50 * (dailyGross * 0.50);
    } else if (params.sicknessDaysInMonth > 90) {
      const daysAt50 = 60;
      const daysAtZero = params.sicknessDaysInMonth - 90;
      sicknessDeductions += daysAt50 * (dailyGross * 0.50) + daysAtZero * dailyGross;
    }
    sicknessRuleApplied = 'Tempo determinato (Art. 19): max 9 mesi nel triennio (1° mese 100%, 2°-3° mese 50%, oltre 90 gg 0%); Brunetta CIA nei primi 10 gg.';
  }

  sicknessDeductions = Number(Math.min(monthlyGross, sicknessDeductions).toFixed(2));

  const strikeDeductions = Number(
    Math.min(monthlyGross - sicknessDeductions, params.strikeDaysInMonth * dailyGross).toFixed(2),
  );

  const effectiveGross = Math.max(0, Number((monthlyGross - sicknessDeductions - strikeDeductions).toFixed(2)));
  const inpsPensionContribution = Number((effectiveGross * 0.0915).toFixed(2));
  const taxableIncomeIrpef = Math.max(0, Number((effectiveGross - inpsPensionContribution).toFixed(2)));

  const yearlyTaxable = taxableIncomeIrpef * 12;
  let yearlyIrpefGross = 0;
  if (yearlyTaxable <= 28000) {
    yearlyIrpefGross = yearlyTaxable * 0.23;
  } else if (yearlyTaxable <= 50000) {
    yearlyIrpefGross = 28000 * 0.23 + (yearlyTaxable - 28000) * 0.35;
  } else {
    yearlyIrpefGross = 28000 * 0.23 + 22000 * 0.35 + (yearlyTaxable - 50000) * 0.43;
  }

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

  const regionalTax = Number((taxableIncomeIrpef * (params.regionalTaxRatePercent / 100)).toFixed(2));
  const municipalTax = Number((taxableIncomeIrpef * (params.municipalTaxRatePercent / 100)).toFixed(2));

  const cuneoTaxRelief = Number(
    (taxableIncomeIrpef <= 2692 ? effectiveGross * (taxableIncomeIrpef <= 1923 ? 0.07 : 0.06) : 0).toFixed(2),
  );

  const monthlyNetSalary = Math.max(
    0,
    Number((effectiveGross - inpsPensionContribution - irpefNet - regionalTax - municipalTax + cuneoTaxRelief).toFixed(2)),
  );

  const estimatedAuuMonthly = Number((params.dependentChildrenCount * 199.40).toFixed(2));
  const totalMonthlyNetWithAuu = Number((monthlyNetSalary + estimatedAuuMonthly).toFixed(2));

  const monthsForYearly = params.contractType === 'permanent' ? 13 : Math.max(1, params.monthsWorkedInYear);
  const yearlyUtilitySalary = effectiveGross * monthsForYearly;
  const tfrYearlyEstimated = Number(((yearlyUtilitySalary / 13.5) * 0.81).toFixed(2));

  const tfrPaymentMode =
    params.contractType === 'permanent'
      ? 'Accantonamento TFR/TFS (non liquidato a fine anno, matura fino a quiescenza)'
      : 'Liquidazione a termine contratto (pagamento differito INPS Gestione Dipendenti Pubblici)';

  const monthlyWorkingHours = params.weeklyHours * 4.33;
  const hourlyRateNet = Number((monthlyNetSalary / Math.max(1, monthlyWorkingHours)).toFixed(2));

  return {
    monthlyGross,
    baseSalary,
    ciaOrRpd,
    ivc,
    fascia: fasciaKey,
    contractType: params.contractType,
    sicknessDeductions,
    sicknessRuleApplied,
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
    tfrPaymentMode,
    hourlyRateNet,
    hasNaspiEntitlement: params.contractType === 'term' || params.contractType === 'short',
    canMonetizeVacation: params.contractType === 'term' || params.contractType === 'short',
  };
}
