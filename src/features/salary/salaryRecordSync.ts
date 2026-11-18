import { Entry } from '../../shared/types';
import { ContractCategory } from './salaryTables';

export interface DetectedContractInfo {
  activeContract: Entry | null;
  profile: string;
  weeklyHours: number;
  contractType: ContractCategory;
  contractLabel: string;
  monthsWorkedInYear: number;
  schoolName: string;
  hasServiceRecords: boolean;
  isPermanent: boolean;
  isAnnualTerm: boolean;
  isDidacticTerm: boolean;
  isShortTerm: boolean;
  contractRuleSummary: string;
}

export interface DetectedAbsenceInfo {
  sicknessDaysInMonth: number;
  sicknessDaysTotalYear: number;
  strikeDaysInMonth: number;
  parentalDaysTotal: number;
  childrenCount: number;
  hasAbsenceRecords: boolean;
}

function calculateEntryDays(start: string, end: string | null): number {
  if (!start) return 0;
  const s = new Date(start);
  const e = end ? new Date(end) : new Date(start);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
  return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function detectCurrentContract(
  records: Entry[],
  defaultProfile = 'CS'
): DetectedContractInfo {
  const serviceRecords = (records || []).filter(r => r.kind === 'service' && r.start);
  if (serviceRecords.length === 0) {
    return {
      activeContract: null,
      profile: defaultProfile,
      weeklyHours: defaultProfile === 'DOCENTE' ? 18 : 36,
      contractType: 'term',
      contractLabel: 'Tempo Determinato al 30/06',
      monthsWorkedInYear: 10,
      schoolName: '',
      hasServiceRecords: false,
      isPermanent: false,
      isAnnualTerm: false,
      isDidacticTerm: true,
      isShortTerm: false,
      contractRuleSummary: 'Nessun servizio registrato. Applicate regole standard supplenza fino al termine delle attività.',
    };
  }

  const sorted = [...serviceRecords].sort((a, b) => {
    const da = new Date(a.start).getTime() || 0;
    const db = new Date(b.start).getTime() || 0;
    return db - da;
  });

  const latest = sorted[0];
  const profile = latest.profile || defaultProfile || 'CS';

  let weeklyHours = profile === 'DOCENTE' ? 18 : 36;
  if (typeof latest.amount === 'number' && latest.amount > 0 && latest.amount <= 36) {
    weeklyHours = Math.round(latest.amount);
  } else if (latest.notes) {
    const match = latest.notes.match(/(\d{1,2})\s*ore/i);
    if (match) {
      weeklyHours = parseInt(match[1], 10);
    }
  }

  const days = calculateEntryDays(latest.start, latest.end);
  const fullText = ((latest.title || '') + ' ' + (latest.notes || '')).toLowerCase();

  let explicitContractType: ContractCategory | null = null;
  if (latest.notes && latest.notes.startsWith('{')) {
    try {
      const parsed = JSON.parse(latest.notes);
      if (parsed.contractType) {
        if (parsed.contractType === 'permanent' || parsed.contractType === 'indeterminato' || parsed.isRuolo) {
          explicitContractType = 'permanent';
        } else if (parsed.contractType === 'annual') {
          explicitContractType = 'annual';
        } else if (parsed.contractType === 'term') {
          explicitContractType = 'term';
        } else if (parsed.contractType === 'short') {
          explicitContractType = 'short';
        }
      }
      if (typeof parsed.weeklyHours === 'number' && parsed.weeklyHours > 0) {
        weeklyHours = parsed.weeklyHours;
      }
    } catch {
      // ignore
    }
  }

  let contractType: ContractCategory = 'term';
  let monthsWorkedInYear = 10;
  let contractLabel = 'Tempo Determinato al 30/06';
  let contractRuleSummary = '';

  const isIndeterminatoText =
    fullText.includes('indeterminato') ||
    fullText.includes('ruolo') ||
    fullText.includes('conferma in ruolo') ||
    fullText.includes('immissione in ruolo') ||
    fullText.includes('nomina in ruolo');

  if (explicitContractType === 'permanent' || isIndeterminatoText || (!latest.end && days > 365)) {
    contractType = 'permanent';
    monthsWorkedInYear = 12;
    contractLabel = 'Ruolo / Tempo Indeterminato';
    contractRuleSummary = 'Contratto a tempo indeterminato (12 mesi + 13ª). Art. 17 CCNL: comporto 18 mesi (9 mesi 100%, 3 mesi 90%, 6 mesi 50%). Ricostruzione carriera DL 69/2023. Divieto monetizzazione ferie DL 95/2012.';
  } else if (
    explicitContractType === 'annual' ||
    latest.end?.endsWith('08-31') ||
    days >= 350 ||
    fullText.includes('31 agosto') ||
    fullText.includes('31/08')
  ) {
    contractType = 'annual';
    monthsWorkedInYear = 12;
    contractLabel = 'Tempo Determinato al 31/08';
    contractRuleSummary = 'Supplenza annuale al 31 agosto (12 mesi). Art. 19 CCNL: comporto 9 mesi nel triennio (1° mese 100%, 2°-3° mese 50%). TFR a termine erogato da INPS.';
  } else if (
    explicitContractType === 'term' ||
    latest.end?.endsWith('06-30') ||
    (days >= 260 && days < 350) ||
    fullText.includes('30 giugno') ||
    fullText.includes('30/06') ||
    fullText.includes('termine attivit')
  ) {
    contractType = 'term';
    monthsWorkedInYear = 10;
    contractLabel = 'Tempo Determinato al 30/06';
    contractRuleSummary = 'Supplenza fino al termine delle attività didattiche (10 mesi). Art. 19 CCNL: comporto 9 mesi. Ferie non godute monetizzate obbligatoriamente (Cassazione 16715/2024). Diritto alla NASpI estiva.';
  } else {
    contractType = 'short';
    monthsWorkedInYear = Math.max(1, Math.min(10, Math.round(days / 30)));
    contractLabel = 'Supplenza Breve e Saltuaria';
    contractRuleSummary = 'Supplenza temporanea/breve. Art. 19 c.10 CCNL: malattia al 50% dal 1° giorno per max 30 gg per anno scolastico. Ferie e TFR liquidati alla scadenza contrattuale.';
  }

  const schoolName = latest.school?.name || latest.title || '';

  return {
    activeContract: latest,
    profile,
    weeklyHours,
    contractType,
    contractLabel,
    monthsWorkedInYear,
    schoolName,
    hasServiceRecords: true,
    isPermanent: contractType === 'permanent',
    isAnnualTerm: contractType === 'annual',
    isDidacticTerm: contractType === 'term',
    isShortTerm: contractType === 'short',
    contractRuleSummary,
  };
}

export function extractAbsenceStats(records: Entry[]): DetectedAbsenceInfo {
  const allRecords = records || [];
  let totalSicknessDays = 0;
  let totalStrikeDays = 0;
  let totalParentalDays = 0;

  for (const r of allRecords) {
    const days = calculateEntryDays(r.start, r.end);
    const text = `${r.title || ''} ${r.notes || ''}`.toLowerCase();

    if (r.kind === 'sickness') {
      totalSicknessDays += days;
    } else if (r.kind === 'parental') {
      totalParentalDays += days;
    } else if (r.kind === 'strike' || text.includes('sciopero')) {
      totalStrikeDays += days;
    }
  }

  const childrenCount = allRecords.filter(r => r.kind === 'child').length;
  const hasAbsenceRecords = totalSicknessDays > 0 || totalStrikeDays > 0 || totalParentalDays > 0;

  const sicknessDaysInMonth = Math.min(30, totalSicknessDays);
  const strikeDaysInMonth = Math.min(30, totalStrikeDays);

  return {
    sicknessDaysInMonth,
    sicknessDaysTotalYear: totalSicknessDays,
    strikeDaysInMonth,
    parentalDaysTotal: totalParentalDays,
    childrenCount,
    hasAbsenceRecords,
  };
}
