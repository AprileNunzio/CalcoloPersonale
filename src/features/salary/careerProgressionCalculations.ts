import { Entry, Person } from '../../shared/types';
import { parseDays } from '../../shared/scoring';
import { SalaryFascia, ContractCategory, CCNL_TABLES } from './salaryTables';
import { detectCurrentContract } from './salaryRecordSync';

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
  oldLawDecurtazioneYears: number;
  salvaInfrazioniGainYears: number;
  inquadramentoFascia: SalaryFascia;
  nextFascia: SalaryFascia | null;
  yearsToNextFascia: number;
  monthlyBaseSalary: number;
  monthlyDifferencePreRuolo: number;
  estimatedArrearsGross: number;
  estimatedArrearsNet: number;
  isEligibleNow: boolean;
  applicabilityNote: string;
}

export interface FerieMonetizzazioneResult {
  totalServiceDaysInYear: number;
  seniorityOver3Years: boolean;
  yearlyBaseDays: number;
  ferieMaturate: number;
  festivitaSoppresseMaturate: number;
  totalSpettanti: number;
  giorniFruitiSospensioneLezioni: number;
  giorniResiduiNonGoduti: number;
  dailyRateGross: number;
  indennitaMonetizzazioneLorda: number;
  indennitaMonetizzazioneNetta: number;
  isEligibleForMonetizzazione: boolean;
  contractCategory: ContractCategory;
  legalNote: string;
}

export interface MobilitaGraduatoriaResult {
  puntiServizioRuolo: number;
  puntiServizioPreRuolo: number;
  puntiContinuitaScuola: number;
  puntiEsigenzeFamiglia: number;
  puntiTitoliGenerali: number;
  punteggioTotaleMobilita: number;
  isPermanentStaff: boolean;
  dettagli: string[];
}

export interface SpezzoniOrariResult {
  activeContractsCount: number;
  totalWeeklyHours: number;
  isOverMaxHours: boolean;
  maxHoursAllowed: number;
  hoursComplianceStatus: 'regular' | 'warning_exceeded' | 'part_time';
  overlapDaysDetected: number;
  effectiveWorkingDays: number;
}

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

  const preRuoloYears = Math.floor(preRuoloDays / 360);
  const preRuoloMonths = Math.floor((preRuoloDays % 360) / 30);
  const preRuoloRemainingDays = preRuoloDays % 30;

  const ruoloYears = Math.floor(ruoloDays / 360);
  const ruoloMonths = Math.floor((ruoloDays % 360) / 30);

  const totalYears = preRuoloYears + ruoloYears;
  const totalMonths = preRuoloMonths + ruoloMonths;

  let oldLawDecurtazioneYears = 0;
  if (preRuoloYears > 4) {
    const excess = preRuoloYears - 4;
    oldLawDecurtazioneYears = Number((excess * (1 / 3)).toFixed(1));
  }
  const salvaInfrazioniGainYears = oldLawDecurtazioneYears;

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

  const table = CCNL_TABLES[profile] || CCNL_TABLES.CS;
  const monthlyBaseSalary = table[inquadramentoFascia];
  const entryLevelSalary = table['0-8'];
  const monthlyDifferencePreRuolo = Math.max(0, monthlyBaseSalary - entryLevelSalary);

  const estimatedArrearsGross = Math.round(monthlyDifferencePreRuolo * 13 * Math.max(1, yearsSinceRole) * 100) / 100;
  const estimatedArrearsNet = Math.round(estimatedArrearsGross * 0.77 * 100) / 100;

  const isEligibleNow = ruoloDays > 0;
  const applicabilityNote = isEligibleNow
    ? 'Personale a tempo indeterminato con servizio di ruolo registrato. Piena applicabilità della riforma D.L. 69/2023 Salva Infrazioni (riconoscimento integrale 100% pre-ruolo senza tagli).'
    : 'Nessun servizio a tempo indeterminato/ruolo attivo rilevato nei record. La ricostruzione di carriera formale è riservata al personale immesso in ruolo post-conferma. I dati mostrano la simulazione della carriera maturata.';

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
    isEligibleNow,
    applicabilityNote,
  };
}

export function calculateFerieMonetizzazione(
  person: Person,
  profile = 'CS',
  giorniFruitiManuali = 12,
  explicitContractType?: ContractCategory
): FerieMonetizzazioneResult {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');

  const detected = detectCurrentContract(records, profile);
  const contractCategory: ContractCategory = explicitContractType || detected.contractType;

  let totalServiceDaysInYear = 0;
  let totalCareerDays = 0;

  for (const s of services) {
    const days = parseDays(s.start, s.end);
    totalCareerDays += days;
    totalServiceDaysInYear += days;
  }

  const effectiveYearDays = Math.min(360, totalServiceDaysInYear > 0 ? totalServiceDaysInYear : 280);
  const seniorityOver3Years = totalCareerDays > (360 * 3);
  const yearlyBaseDays = seniorityOver3Years ? 32 : 30;

  const ferieMaturate = Math.round(((effectiveYearDays / 360) * yearlyBaseDays) * 10) / 10;
  const festivitaSoppresseMaturate = Math.round(((effectiveYearDays / 360) * 4) * 10) / 10;
  const totalSpettanti = Math.round((ferieMaturate + festivitaSoppresseMaturate) * 10) / 10;

  const giorniResiduiNonGoduti = Math.max(0, Math.round((totalSpettanti - giorniFruitiManuali) * 10) / 10);

  const table = CCNL_TABLES[profile] || CCNL_TABLES.CS;
  const monthlySalary = table['0-8'];
  const dailyRateGross = Math.round((monthlySalary / 30) * 100) / 100;

  let isEligibleForMonetizzazione = false;
  let indennitaMonetizzazioneLorda = 0;
  let indennitaMonetizzazioneNetta = 0;
  let legalNote = '';

  if (contractCategory === 'permanent') {
    isEligibleForMonetizzazione = false;
    legalNote = 'Personale a Tempo Indeterminato: divieto assoluto di monetizzazione delle ferie per legge (D.L. 95/2012 e CCNL). I ' + totalSpettanti + ' giorni di ferie spettanti devono essere fruiti durante l\'anno scolastico.';
  } else if (contractCategory === 'annual') {
    isEligibleForMonetizzazione = false;
    legalNote = 'Supplenza annuale al 31/08: le ferie devono essere interamente fruite entro il 31 agosto (inclusi luglio e agosto). La monetizzazione è preclusa salvo documentata e accertata impossibilità oggettiva ex art. 19 CCNL.';
  } else if (contractCategory === 'term') {
    isEligibleForMonetizzazione = giorniResiduiNonGoduti > 0;
    indennitaMonetizzazioneLorda = Math.round(dailyRateGross * giorniResiduiNonGoduti * 100) / 100;
    indennitaMonetizzazioneNetta = Math.round(indennitaMonetizzazioneLorda * 0.77 * 100) / 100;
    legalNote = 'Supplenza fino al 30/06: ordinanza Cassazione n. 16715/2024 e CGUE C-61/17. Poiché il rapporto cessa al 30 giugno, le ferie residue non godute devono essere OBBLIGATORIAMENTE liquidate nel cedolino finale di luglio/agosto.';
  } else {
    isEligibleForMonetizzazione = giorniResiduiNonGoduti > 0;
    indennitaMonetizzazioneLorda = Math.round(dailyRateGross * giorniResiduiNonGoduti * 100) / 100;
    indennitaMonetizzazioneNetta = Math.round(indennitaMonetizzazioneLorda * 0.77 * 100) / 100;
    legalNote = 'Supplenza breve e saltuaria: le ferie maturate in proporzione ai giorni di effettivo servizio non godute sono liquidate di diritto alla conclusione del contratto.';
  }

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
    isEligibleForMonetizzazione,
    contractCategory,
    legalNote,
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

  const isPermanentStaff = anniRuolo > 0;
  const puntiServizioRuolo = anniRuolo * 6;
  const puntiServizioPreRuolo = anniPreRuolo * 3;
  const puntiContinuitaScuola = anniRuolo >= 3 ? (anniRuolo - 2) * 2 : 0;

  let puntiEsigenzeFamiglia = 6;
  const dettagli: string[] = [];

  if (isPermanentStaff) {
    dettagli.push(`Servizio di ruolo: ${anniRuolo} anni x 6 punti = ${puntiServizioRuolo} pt`);
  } else {
    dettagli.push('Personale non di ruolo: la graduatoria interna d\'istituto si applica solo al personale con contratto a tempo indeterminato.');
  }

  if (anniPreRuolo > 0) {
    dettagli.push(`Servizio pre-ruolo: ${anniPreRuolo} anni x 3 punti = ${puntiServizioPreRuolo} pt`);
  }
  if (puntiContinuitaScuola > 0) {
    dettagli.push(`Continuità nella sede: +${puntiContinuitaScuola} pt (oltre il primo triennio)`);
  }

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
    isPermanentStaff,
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
