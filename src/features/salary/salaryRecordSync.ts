import { Entry } from '../../shared/types';

export interface DetectedContractInfo {
  activeContract: Entry | null;
  profile: string;
  weeklyHours: number;
  contractType: 'annual' | 'term' | 'short';
  monthsWorkedInYear: number;
  schoolName: string;
  hasServiceRecords: boolean;
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

/**
 * Detects the most recent or active contract from the person's service records.
 */
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
      monthsWorkedInYear: 10,
      schoolName: '',
      hasServiceRecords: false,
    };
  }

  // Sort by start date descending to find the latest contract
  const sorted = [...serviceRecords].sort((a, b) => {
    const da = new Date(a.start).getTime() || 0;
    const db = new Date(b.start).getTime() || 0;
    return db - da;
  });

  const latest = sorted[0];
  const profile = latest.profile || defaultProfile || 'CS';

  // Detect weekly hours
  let weeklyHours = profile === 'DOCENTE' ? 18 : 36;
  if (typeof latest.amount === 'number' && latest.amount > 0 && latest.amount <= 36) {
    weeklyHours = Math.round(latest.amount);
  } else if (latest.notes) {
    const match = latest.notes.match(/(\d{1,2})\s*ore/i);
    if (match) {
      weeklyHours = parseInt(match[1], 10);
    }
  }

  // Detect contract type and duration
  const days = calculateEntryDays(latest.start, latest.end);
  let contractType: 'annual' | 'term' | 'short' = 'term';
  let monthsWorkedInYear = 10;

  if (latest.end) {
    if (latest.end.endsWith('08-31') || days >= 350) {
      contractType = 'annual';
      monthsWorkedInYear = 12;
    } else if (latest.end.endsWith('06-30') || (days >= 270 && days < 350)) {
      contractType = 'term';
      monthsWorkedInYear = 10;
    } else {
      contractType = 'short';
      monthsWorkedInYear = Math.max(1, Math.min(12, Math.round(days / 30)));
    }
  } else {
    contractType = 'term';
    monthsWorkedInYear = 10;
  }

  // Check JSON notes for explicit contractType or weeklyHours
  if (latest.notes && latest.notes.startsWith('{')) {
    try {
      const parsed = JSON.parse(latest.notes);
      if (parsed.contractType) {
        if (parsed.contractType === 'annual') {
          contractType = 'annual';
          monthsWorkedInYear = 12;
        } else if (parsed.contractType === 'term') {
          contractType = 'term';
          monthsWorkedInYear = 10;
        } else if (parsed.contractType === 'short') {
          contractType = 'short';
          monthsWorkedInYear = Math.max(1, Math.min(12, Math.round(days / 30)));
        }
      }
      if (typeof parsed.weeklyHours === 'number' && parsed.weeklyHours > 0) {
        weeklyHours = parsed.weeklyHours;
      }
    } catch {
      // ignore
    }
  }

  const schoolName = latest.school?.name || latest.title || '';

  return {
    activeContract: latest,
    profile,
    weeklyHours,
    contractType,
    monthsWorkedInYear,
    schoolName,
    hasServiceRecords: true,
  };
}

/**
 * Extracts and sums up sickness days, strike days, and parental leave from absence records.
 */
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

  // For monthly simulation, cap to typical monthly presence (up to 30 days)
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
