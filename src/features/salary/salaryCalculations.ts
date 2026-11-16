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
}

export interface SalaryBreakdownResult {
  monthlyGross: number;
  baseSalary: number;
  ciaOrRpd: number; // Compenso Individuale Accessorio (ATA) o RPD (Docenti)
  ivc: number; // Indennità Vacanza Contrattuale
  sicknessDeductions: number;
  strikeDeductions: number;
  effectiveGross: number;
  inpsPensionContribution: number; // ~9.15% a carico dipendente
  taxableIncomeIrpef: number;
  irpefGross: number;
  employmentTaxCredit: number; // Detrazione lavoro dipendente
  irpefNet: number;
  regionalTax: number;
  municipalTax: number;
  cuneoTaxRelief: number; // Taglio cuneo fiscale (6% o 7%)
  monthlyNetSalary: number;
  estimatedAuuMonthly: number; // Assegno Unico Figli stimato
  totalMonthlyNetWithAuu: number;
  tfrYearlyEstimated: number; // TFR stimato maturato a fine contratto
  hourlyRateNet: number;
}

// Tabelle tabellari CCNL Comparto Istruzione e Ricerca (valori lordi mensili per 36 ore)
const BASE_SALARIES: Record<string, { base: number; cia: number; ivc: number }> = {
  CS: { base: 1358.50, cia: 79.40, ivc: 9.10 },
  OS: { base: 1412.30, cia: 79.40, ivc: 9.45 },
  AA: { base: 1492.20, cia: 79.40, ivc: 10.00 },
  AT: { base: 1492.20, cia: 79.40, ivc: 10.00 },
  CU: { base: 1492.20, cia: 79.40, ivc: 10.00 },
  GU: { base: 1412.30, cia: 79.40, ivc: 9.45 },
  CR: { base: 1358.50, cia: 79.40, ivc: 9.10 },
  DOCENTE: { base: 1680.00, cia: 174.50, ivc: 11.20 },
};

export function calculateSalaryBreakdown(params: SalarySimulationParams): SalaryBreakdownResult {
  const profileKey = params.profile in BASE_SALARIES ? params.profile : 'CS';
  const table = BASE_SALARIES[profileKey];

  const fullTimeHours = profileKey === 'DOCENTE' ? 18 : 36;
  const hourRatio = Math.min(1, Math.max(0.1, params.weeklyHours / fullTimeHours));

  const baseSalary = Number((table.base * hourRatio).toFixed(2));
  const ciaOrRpd = Number((table.cia * hourRatio).toFixed(2));
  const ivc = Number((table.ivc * hourRatio).toFixed(2));

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
    const daysAt50 = 60; // 31-90
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

  // Proiezione annua per scaglioni IRPEF 2024 (23% fino a 28.000€)
  const yearlyTaxable = taxableIncomeIrpef * 12;
  let yearlyIrpefGross = 0;
  if (yearlyTaxable <= 28000) {
    yearlyIrpefGross = yearlyTaxable * 0.23;
  } else if (yearlyTaxable <= 50000) {
    yearlyIrpefGross = 28000 * 0.23 + (yearlyTaxable - 28000) * 0.35;
  } else {
    yearlyIrpefGross = 28000 * 0.23 + 22000 * 0.35 + (yearlyTaxable - 50000) * 0.43;
  }

  // Detrazione da lavoro dipendente 2024 (max 1.955€ fino a 15.000€, decrescente fino a 28.000€)
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

  // Esonero contributivo / Taglio cuneo fiscale (6% o 7% se reddito < 25.000 o 35.000)
  const cuneoTaxRelief = Number(
    (taxableIncomeIrpef <= 2692 ? effectiveGross * (taxableIncomeIrpef <= 1923 ? 0.07 : 0.06) : 0).toFixed(2),
  );

  const monthlyNetSalary = Math.max(
    0,
    Number((effectiveGross - inpsPensionContribution - irpefNet - regionalTax - municipalTax + cuneoTaxRelief).toFixed(2)),
  );

  // Assegno Unico Figli (stima media di base ~199€ a figlio)
  const estimatedAuuMonthly = Number((params.dependentChildrenCount * 199.40).toFixed(2));
  const totalMonthlyNetWithAuu = Number((monthlyNetSalary + estimatedAuuMonthly).toFixed(2));

  // Stima TFR maturato (retribuzione utile annua diviso 13.5)
  const yearlyUtilitySalary = effectiveGross * Math.max(1, params.monthsWorkedInYear);
  const tfrYearlyEstimated = Number(((yearlyUtilitySalary / 13.5) * 0.81).toFixed(2));

  const monthlyWorkingHours = params.weeklyHours * 4.33;
  const hourlyRateNet = Number((monthlyNetSalary / Math.max(1, monthlyWorkingHours)).toFixed(2));

  return {
    monthlyGross,
    baseSalary,
    ciaOrRpd,
    ivc,
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
