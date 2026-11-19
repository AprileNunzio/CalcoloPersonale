import { Person, Entry } from './types';
import { calculateDaysBetween } from '../features/records/serviceCalculations';
import { PROFILE_LABELS } from './personUtils';

export interface ProfileMilestone24M {
  profileCode: string;
  profileLabel: string;
  milestoneIndex: number; // 1 for 1° Traguardo, 2 for 2° Traguardo
  isReached: boolean;
  reachedDate?: string; // e.g. "2012-01-18"
  reachedSchoolYear?: string; // e.g. "A.S. 2011/2012"
  reachedCalendarYear?: number; // e.g. 2012
  serviceEntryId?: string; // ID of the specific service record where 24M was reached
  specificDays: number;
  otherAtaDays: number;
  totalDays: number;
  targetDays: number;
  remainingDays: number;
  percent: number;
  summaryLabel: string;
}

export interface CareerMilestonesSummary {
  hasRuolo: boolean;
  ruoloProfile?: string;
  ruoloEntryId?: string;
  ruoloStartDate?: string;
  milestones24M: ProfileMilestone24M[];
  milestoneServiceIds: Set<string>; // Set of entry IDs that are 24M milestone cards
  ruoloServiceIds: Set<string>; // Set of entry IDs that are Ruolo milestone cards
}

function getSchoolYearFromIso(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length < 2) return '';
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  // School year runs from Sept 1 to Aug 31
  if (m >= 9) {
    return `A.S. ${y}/${y + 1}`;
  }
  return `A.S. ${y - 1}/${y}`;
}

export function computeCareerMilestones(person: Person): CareerMilestonesSummary {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');
  const STATUTORY_TARGET_DAYS = 706; // 23 mesi e 16 giorni

  let hasRuolo = false;
  let ruoloProfile: string | undefined = undefined;
  let ruoloEntryId: string | undefined = undefined;
  let ruoloStartDate: string | undefined = undefined;
  const ruoloServiceIds = new Set<string>();

  // Check for confirmed permanent role (prendendo il più recente come ruolo attuale)
  const sortedRoleCandidates = [...services]
    .filter(s => {
      let parsed: Record<string, unknown> = {};
      try {
        if (s.notes?.startsWith('{')) parsed = JSON.parse(s.notes);
      } catch {}
      return parsed.isRuolo === true || parsed.contractType === 'permanent';
    })
    .sort((a, b) => (b.start || '').localeCompare(a.start || ''));

  if (sortedRoleCandidates.length > 0) {
    hasRuolo = true;
    for (const s of sortedRoleCandidates) {
      ruoloServiceIds.add(s.id);
    }
    const latestRuolo = sortedRoleCandidates[0];
    ruoloProfile = latestRuolo.profile || person.profile;
    ruoloEntryId = latestRuolo.id;
    ruoloStartDate = latestRuolo.start;
  }

  // Sort services chronologically ascending (oldest first) to track cumulative history
  const chronologicalServices = [...services].sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  // Collect distinct profiles worked
  const activeProfilesList: string[] = [];
  for (const s of chronologicalServices) {
    if (s.profile && s.profile !== 'DOCENTE' && !activeProfilesList.includes(s.profile)) {
      activeProfilesList.push(s.profile);
    }
  }
  if (person.profile && person.profile in PROFILE_LABELS && !activeProfilesList.includes(person.profile)) {
    activeProfilesList.push(person.profile);
  }
  if (activeProfilesList.length === 0) {
    activeProfilesList.push('CS');
  }

  const milestoneServiceIds = new Set<string>();
  const milestones24M: ProfileMilestone24M[] = [];

  activeProfilesList.forEach((profCode, idx) => {
    let cumulativeValidDays = 0;
    let specificDays = 0;
    let otherAtaDays = 0;
    let isReached = false;
    let reachedDate: string | undefined = undefined;
    let reachedSchoolYear: string | undefined = undefined;
    let reachedCalendarYear: number | undefined = undefined;
    let milestoneEntryId: string | undefined = undefined;

    for (const s of chronologicalServices) {
      const isParitaria = (s.title + ' ' + (s.notes || '')).toLowerCase().includes('paritaria');
      if (isParitaria) continue;

      const isDocente =
        s.profile === 'DOCENTE' ||
        (s.title + ' ' + (s.notes || '')).toLowerCase().includes('docente');
      if (isDocente) continue;

      let parsed: Record<string, unknown> = {};
      try {
        if (s.notes?.startsWith('{')) parsed = JSON.parse(s.notes);
      } catch {}

      const isRuoloRec = parsed.isRuolo === true || parsed.contractType === 'permanent';
      const isOngoing = !s.end || isRuoloRec;
      const days = calculateDaysBetween(s.start, isOngoing ? null : s.end);
      const wasReachedBefore = cumulativeValidDays >= STATUTORY_TARGET_DAYS;

      if (s.profile === profCode) {
        specificDays += days;
        cumulativeValidDays += days;
      } else {
        otherAtaDays += days;
      }

      if (!wasReachedBefore && cumulativeValidDays >= STATUTORY_TARGET_DAYS) {
        isReached = true;
        milestoneEntryId = s.id;
        milestoneServiceIds.add(s.id);
        reachedDate = s.end || s.start;
        reachedSchoolYear = getSchoolYearFromIso(reachedDate);
        reachedCalendarYear = new Date(reachedDate).getFullYear();
      }
    }

    const totalDays = cumulativeValidDays;
    const remainingDays = Math.max(0, STATUTORY_TARGET_DAYS - totalDays);
    const percent = Math.min(100, Math.round((totalDays / STATUTORY_TARGET_DAYS) * 100));

    let summaryLabel = '';
    const milestoneNumber = idx + 1;
    const labelPrefix = activeProfilesList.length > 1 ? `${milestoneNumber}° Traguardo (${profCode})` : 'Traguardo 24 Mesi';

    if (isReached && reachedSchoolYear) {
      summaryLabel = `${labelPrefix}: Raggiunto nel ${reachedSchoolYear} (${reachedCalendarYear}) con ${totalDays} gg validi`;
    } else {
      summaryLabel = `${labelPrefix}: In maturazione (${totalDays}/${STATUTORY_TARGET_DAYS} gg - Mancano ${remainingDays} gg)`;
    }

    milestones24M.push({
      profileCode: profCode,
      profileLabel: PROFILE_LABELS[profCode] || profCode,
      milestoneIndex: milestoneNumber,
      isReached,
      reachedDate,
      reachedSchoolYear,
      reachedCalendarYear,
      serviceEntryId: milestoneEntryId,
      specificDays,
      otherAtaDays,
      totalDays,
      targetDays: STATUTORY_TARGET_DAYS,
      remainingDays,
      percent,
      summaryLabel,
    });
  });

  return {
    hasRuolo,
    ruoloProfile,
    ruoloEntryId,
    ruoloStartDate,
    milestones24M,
    milestoneServiceIds,
    ruoloServiceIds,
  };
}
