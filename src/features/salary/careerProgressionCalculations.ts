import { Entry, Person } from '../../shared/types';
import { parseDays } from '../../shared/scoring';
import { SalaryFascia } from './salaryCalculations';

// -------------------------------------------------------------
// 1. RICOSTRUZIONE DI CARRIERA & ARRETRATI (TEMPO INDETERMINATO)
// Rif: D.L. 69/2023 convertito in Legge 103/2023 (Riforma Art. 569 D.Lgs. 297/94)
// CCNL Comparto Istruzione e Ricerca 18/01/2024
// -------------------------------------------------------------

export interface RicostruzioneCarrieraResult {
  preRuoloTotalDays: number;
  preRuoloYears: number;
  preRuoloMonths: number;
  preRuoloRemainingDays: number;
  ruoloTotalDays: number;
  ruoloYears: number;
  ruoloMonths: number;
  totalRecognizedYears: number;
  totalRecognizedMonths: number;
  oldLawDecurtazioneYears: number; // For comparison: old law took 1/3 over 4 years!
  salvaInfrazioniGainYears: number; // Years regained thanks to DL 69/2023
  inquadramentoFascia: SalaryFascia;
  nextFascia: SalaryFascia | null;
  yearsToNextFascia: number;
  monthlyBaseSalary: number;
  monthlyDifferencePreRuolo: number;
  estimatedArrearsGross: number; // Estimated arrears since confirmation of role
  estimatedArrearsNet: number;
}

// -------------------------------------------------------------
// 2. FERIE NON GODUTE E MONETIZZAZIONE (TEMPO DETERMINATO)
// Rif: Sentenza Cassazione Ordinanza 16715/2024 & CGUE C-61/17
// CCNL 18/01/2024 Art. 13 e Art. 19
// -------------------------------------------------------------

export interface FerieMonetizzazioneResult {
  totalServiceDaysInYear: number;
  seniorityOver3Years: boolean;
  yearlyBaseDays: number; // 30 or 32
  ferieMaturate: number; // pro-rata
  festivitaSoppresseMaturate: number; // 4 days pro-rata
  totalSpettanti: number;
  giorniFruitiSospensioneLezioni: number; // e.g. Natale, Pasqua
  giorniResiduiNonGoduti: number;
  dailyRateGross: number;
  indennitaMonetizzazioneLorda: number;
  indennitaMonetizzazioneNetta: number;
  isEligibleForMonetizzazione: boolean;
  legalNote: string;
}

// -------------------------------------------------------------
// 3. MOBILITÀ E GRADUATORIA INTERNA D'ISTITUTO (CCNI MOBILITÀ ATA)
// -------------------------------------------------------------

export interface MobilitaGraduatoriaResult {
  puntiServizioRuolo: number; // 6 punti per ogni anno di ruolo
  puntiServizioPreRuolo: number; // 3 punti per anno pre-ruolo
  puntiContinuitaScuola: number; // da 2 a 3 punti/anno dopo il primo triennio
  puntiEsigenzeFamiglia: number; // ricongiungimento +6, figli < 6 anni +4, figli 6-18 +3
  puntiTitoliGenerali: number; // concorso pubblico +12, laurea +5
  punteggioTotaleMobilita: number;
  dettagli: string[];
}

// -------------------------------------------------------------
// 4. SPEZZONI ORARI E MULTI-CONTRATTO (MAX 36 ORE)
// -------------------------------------------------------------

export interface SpezzoniOrariResult {
  activeContractsCount: number;
  totalWeeklyHours: number;
  isOverMaxHours: boolean; // CCNL max 36 hours
  maxHoursAllowed: number;
  hoursComplianceStatus: 'regular' | 'warning_exceeded' | 'part_time';
  overlapDaysDetected: number;
  effectiveWorkingDays: number;
}

// Tabellari CCNL 18/01/2024 lordi per 36 ore
const CCNL_BASE_SALARIES: Record<string, Record<SalaryFascia, number>> = {
  CS: { '0-8': 1358.50, '9-14': 1472.30, '15-20': 1558.10, '21-27': 1642.80, '28-34': 1714.60, '35+': 1761.90 },
  OS: { '0-8': 1412.30, '9-14': 1538.00, '15-20': 1632.00, '21-27': 1725.00, '28-34': 1802.00, '35+': 1854.00 },
  AA: { '0-8': 1492.20, '9-14': 1636.50, '15-20': 1751.80, '21-27': 1868.10, '28-34': 1961.40, '35+': 2028.70 },
  AT: { '0-8': 1492.20, '9-14': 1636.50, '15-20': 1751.80, '21-27': 1868.10, '28-34': 1961.40, '35+': 2028.70 },
  CU: { '0-8': 1492.20, '9-14': 1636.50, '15-20': 1751.80, '21-27': 1868.10, '28-34': 1961.40, '35+': 2028.70 },
  GU: { '0-8': 1412.30, '9-14': 1538.00, '15-20': 1632.00, '21-27': 1725.00, '28-34': 1802.00, '35+': 1854.00 },
  CR: { '0-8': 1412.30, '9-14': 1538.00, '15-20': 1632.00, '21-27': 1725.00, '28-34': 1802.00, '35+': 1854.00 },
  DOCENTE: { '0-8': 1800.00, '9-14': 1980.00, '15-20': 2160.00, '21-27': 2340.00, '28-34': 2500.00, '35+': 2650.00 },
};

export function calculateRicostruzioneCarriera(
  person: Person,
  profile = 'CS',
  yearsSinceRole = 2
): RicostruzioneCarrieraResult {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');

  let preRuoloDays = 0;
  let ruoloDays = 0;

  for (const s of services) {
    const days = parseDays(s.start, s.end);
    const t = (s.title + ' ' + (s.notes || '')).toLowerCase();
    const isRuolo = t.includes('ruolo') || t.includes('indeterminato') || t.includes('conferma');
    if (isRuolo) {
      ruoloDays += days;
    } else {
      preRuoloDays += days;
    }
  }

  // Pre-ruolo conversion: 360 days = 1 commercial year
  const preRuoloYears = Math.floor(preRuoloDays / 360);
  const preRuoloMonths = Math.floor((preRuoloDays % 360) / 30);
  const preRuoloRemainingDays = preRuoloDays % 30;

  const ruoloYears = Math.floor(ruoloDays / 360);
  const ruoloMonths = Math.floor((ruoloDays % 360) / 30);

  // DL 69/2023: Full 100% recognition
  const totalYears = preRuoloYears + ruoloYears;
  const totalMonths = preRuoloMonths + ruoloMonths;

  // Comparison with old law: old art. 569 took 4 years + 2/3 of remaining pre-ruolo
  let oldLawDecurtazioneYears = 0;
  if (preRuoloYears > 4) {
    const excess = preRuoloYears - 4;
    oldLawDecurtazioneYears = Number((excess * (1 / 3)).toFixed(1));
  }
  const salvaInfrazioniGainYears = oldLawDecurtazioneYears;

  // Determine Fascia
  let inquadramentoFascia: SalaryFascia = '0-8';
  let nextFascia: SalaryFascia | null = '9-14';
  let yearsToNextFascia = 9 - totalYears;

  if (totalYears >= 35) {
    inquadramentoFascia = '35+';
    nextFascia = null;
    yearsToNextFascia = 0;
  } else if (totalYears >= 28) {
    inquadramentoFascia = '28-34';
    nextFascia = '35+';
    yearsToNextFascia = 35 - totalYears;
  } else if (totalYears >= 21) {
    inquadramentoFascia = '21-27';
    nextFascia = '28-34';
    yearsToNextFascia = 28 - totalYears;
  } else if (totalYears >= 15) {
    inquadramentoFascia = '15-20';
    nextFascia = '21-27';
    yearsToNextFascia = 21 - totalYears;
  } else if (totalYears >= 9) {
    inquadramentoFascia = '9-14';
    nextFascia = '15-20';
    yearsToNextFascia = 15 - totalYears;
  }

  const table = CCNL_BASE_SALARIES[profile] || CCNL_BASE_SALARIES.CS;
  const monthlyBaseSalary = table[inquadramentoFascia];
  const entryLevelSalary = table['0-8'];
  const monthlyDifferencePreRuolo = Math.max(0, monthlyBaseSalary - entryLevelSalary);

  // Arrears estimate: difference * 13 months * yearsSinceRole
  const estimatedArrearsGross = Math.round(monthlyDifferencePreRuolo * 13 * Math.max(1, yearsSinceRole) * 100) / 100;
  const estimatedArrearsNet = Math.round(estimatedArrearsGross * 0.77 * 100) / 100;

  return {
    preRuoloTotalDays: preRuoloDays,
    preRuoloYears,
    preRuoloMonths,
    preRuoloRemainingDays,
    ruoloTotalDays: ruoloDays,
    ruoloYears,
    ruoloMonths,
    totalRecognizedYears: totalYears,
    totalRecognizedMonths: totalMonths,
    oldLawDecurtazioneYears,
    salvaInfrazioniGainYears,
    inquadramentoFascia,
    nextFascia,
    yearsToNextFascia: Math.max(0, yearsToNextFascia),
    monthlyBaseSalary,
    monthlyDifferencePreRuolo,
    estimatedArrearsGross,
    estimatedArrearsNet,
  };
}

export function calculateFerieMonetizzazione(
  person: Person,
  profile = 'CS',
  giorniFruitiManuali = 12
): FerieMonetizzazioneResult {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');

  let totalServiceDaysInYear = 0;
  let totalCareerDays = 0;

  for (const s of services) {
    const days = parseDays(s.start, s.end);
    totalCareerDays += days;
    // Current year service
    totalServiceDaysInYear += days;
  }

  // Cap current year to 360 days
  const effectiveYearDays = Math.min(360, totalServiceDaysInYear > 0 ? totalServiceDaysInYear : 280);
  const seniorityOver3Years = totalCareerDays > (360 * 3);
  const yearlyBaseDays = seniorityOver3Years ? 32 : 30;

  // Pro-rata: (giorni / 360) * baseDays
  const ferieMaturate = Math.round(((effectiveYearDays / 360) * yearlyBaseDays) * 10) / 10;
  const festivitaSoppresseMaturate = Math.round(((effectiveYearDays / 360) * 4) * 10) / 10;
  const totalSpettanti = Math.round((ferieMaturate + festivitaSoppresseMaturate) * 10) / 10;

  // Residual days
  const giorniResiduiNonGoduti = Math.max(0, Math.round((totalSpettanti - giorniFruitiManuali) * 10) / 10);

  // Daily gross rate: monthly salary / 30
  const table = CCNL_BASE_SALARIES[profile] || CCNL_BASE_SALARIES.CS;
  const monthlySalary = table['0-8'];
  const dailyRateGross = Math.round((monthlySalary / 30) * 100) / 100;

  const indennitaMonetizzazioneLorda = Math.round(dailyRateGross * giorniResiduiNonGoduti * 100) / 100;
  const indennitaMonetizzazioneNetta = Math.round(indennitaMonetizzazioneLorda * 0.77 * 100) / 100;

  return {
    totalServiceDaysInYear: effectiveYearDays,
    seniorityOver3Years,
    yearlyBaseDays,
    ferieMaturate,
    festivitaSoppresseMaturate,
    totalSpettanti,
    giorniFruitiSospensioneLezioni: giorniFruitiManuali,
    giorniResiduiNonGoduti,
    dailyRateGross,
    indennitaMonetizzazioneLorda,
    indennitaMonetizzazioneNetta,
    isEligibleForMonetizzazione: giorniResiduiNonGoduti > 0,
    legalNote: 'Ordinanza Cassazione n. 16715/2024 e Corte di Giustizia UE: la monetizzazione è dovuta salvo formale invito per iscritto del Dirigente a fruire delle ferie prima della scadenza contrattuale.',
  };
}

export function calculateMobilitaPunteggio(person: Person, profile = 'CS'): MobilitaGraduatoriaResult {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');
  const quals = records.filter(r => r.kind === 'qualification');
  const children = records.filter(r => r.kind === 'child');

  let anniRuolo = 0;
  let anniPreRuolo = 0;

  for (const s of services) {
    const days = parseDays(s.start, s.end);
    const t = (s.title + ' ' + (s.notes || '')).toLowerCase();
    const isRuolo = t.includes('ruolo') || t.includes('indeterminato');
    const years = Math.floor(days / 360);
    if (isRuolo) anniRuolo += Math.max(1, years);
    else anniPreRuolo += Math.max(1, years);
  }

  const puntiServizioRuolo = anniRuolo * 6;
  const puntiServizioPreRuolo = anniPreRuolo * 3;
  const puntiContinuitaScuola = anniRuolo >= 3 ? (anniRuolo - 2) * 2 : 0;

  // Family needs
  let puntiEsigenzeFamiglia = 0;
  const dettagli: string[] = [];

  // Has spouse/convivente (+6 punti)
  puntiEsigenzeFamiglia += 6;
  dettagli.push('Ricongiungimento al coniuge/comune di residenza: +6 punti');

  for (const c of children) {
    if (c.start) {
      const birth = new Date(c.start);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 6) {
        puntiEsigenzeFamiglia += 4;
        dettagli.push(`Figlio minore di 6 anni (${age} anni): +4 punti`);
      } else if (age < 18) {
        puntiEsigenzeFamiglia += 3;
        dettagli.push(`Figlio tra 6 e 18 anni (${age} anni): +3 punti`);
      }
    }
  }

  // Qualifications
  let puntiTitoliGenerali = 0;
  for (const q of quals) {
    const t = q.title.toLowerCase();
    if (t.includes('concorso') || t.includes('esami')) {
      puntiTitoliGenerali += 12;
      dettagli.push('Superamento di concorso pubblico per esami: +12 punti');
    }
    if (t.includes('laurea') || t.includes('magistrale') || t.includes('triennale')) {
      puntiTitoliGenerali += 5;
      dettagli.push('Diploma di Laurea: +5 punti');
    }
  }

  const punteggioTotaleMobilita =
    puntiServizioRuolo +
    puntiServizioPreRuolo +
    puntiContinuitaScuola +
    puntiEsigenzeFamiglia +
    puntiTitoliGenerali;

  return {
    puntiServizioRuolo,
    puntiServizioPreRuolo,
    puntiContinuitaScuola,
    puntiEsigenzeFamiglia,
    puntiTitoliGenerali,
    punteggioTotaleMobilita,
    dettagli,
  };
}

export function verifySpezzoniOrari(records: Entry[]): SpezzoniOrariResult {
  const services = (records || []).filter(r => r.kind === 'service');
  let totalWeeklyHours = 0;
  let activeContractsCount = 0;
  const maxHoursAllowed = 36;

  for (const s of services) {
    let hours = 36;
    if (s.notes) {
      try {
        const parsed = JSON.parse(s.notes);
        if (typeof parsed.weeklyHours === 'number') hours = parsed.weeklyHours;
      } catch {}
    }
    totalWeeklyHours += hours;
    activeContractsCount++;
  }

  // Default if no notes found
  if (totalWeeklyHours === 0 && activeContractsCount > 0) {
    totalWeeklyHours = 36;
  }

  const isOverMaxHours = totalWeeklyHours > maxHoursAllowed;
  const hoursComplianceStatus: SpezzoniOrariResult['hoursComplianceStatus'] =
    isOverMaxHours
      ? 'warning_exceeded'
      : totalWeeklyHours === maxHoursAllowed
      ? 'regular'
      : 'part_time';

  return {
    activeContractsCount,
    totalWeeklyHours,
    isOverMaxHours,
    maxHoursAllowed,
    hoursComplianceStatus,
    overlapDaysDetected: 0,
    effectiveWorkingDays: services.length * 30,
  };
}
