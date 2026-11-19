import { Person } from '../types';
import { ATA_PROFILES, PROFILE_LABELS } from '../personUtils';
import {
  MinisterialDecree,
  SchoolYearServiceBreakdown,
  ScoreValidationDecreeItem,
  ScoreValidationData,
  ProfileScore,
} from './scoringTypes';
import { checkHasCiad } from './ciadRules';
import {
  normalizeGrade,
  extractAccessQualification,
  computeAccessScore,
} from './accessScoring';
import { computeCulturalScore } from './culturalScoring';
import {
  parseDays,
  calculateMonths,
  splitServiceBySchoolYears,
} from './serviceScoring';
import { extractScoreValidations } from './validationScoring';

export * from './scoringTypes';
export * from './ciadRules';
export * from './accessScoring';
export * from './culturalScoring';
export * from './serviceScoring';
export * from './validationScoring';

export function getActiveProfiles(person: Person): string[] {
  const records = person.records || [];

  // Filter for real ATA applications, ignoring 30-school selections or validation records
  const applications = records
    .filter(
      r =>
        r.kind === 'application' &&
        !r.title?.toLowerCase().includes('30 scuole') &&
        !r.title?.toLowerCase().includes('scelta 30')
    )
    .sort((a, b) => (b.start || '').localeCompare(a.start || ''));

  // Look for the latest application that specifies profiles
  for (const app of applications) {
    if (app.notes) {
      try {
        const data = typeof app.notes === 'string' ? JSON.parse(app.notes.trim()) : app.notes;
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          const validProfiles = data.profiles.filter(
            (p: string) => typeof p === 'string' && p.trim() in PROFILE_LABELS
          );
          if (validProfiles.length > 0) {
            return validProfiles;
          }
        }
      } catch {
        // Continue checking fallback
      }
    }
    if (app.profile && app.profile in PROFILE_LABELS) {
      return [app.profile];
    }
  }

  // Fallback if no explicit application with profiles is found
  const fallbackSet = new Set<string>();
  for (const r of records) {
    if (r.kind === 'service' && r.profile && r.profile !== 'DOCENTE' && r.profile in PROFILE_LABELS) {
      fallbackSet.add(r.profile);
    }
  }
  if (person.profile && person.profile in PROFILE_LABELS) {
    fallbackSet.add(person.profile);
  }

  return fallbackSet.size > 0 ? Array.from(fallbackSet) : ['CS'];
}

export function calculateProfileScores(
  person: Person,
  onlyActive = true,
  decree: MinisterialDecree = 'DM_89_2024'
): ProfileScore[] {
  const activeCodes = getActiveProfiles(person);
  if (onlyActive && activeCodes.length === 0) {
    return [];
  }
  const profilesToEvaluate = onlyActive
    ? activeCodes
        .map(code => ATA_PROFILES.find(p => p.code === code))
        .filter((p): p is (typeof ATA_PROFILES)[number] => p !== undefined)
    : ATA_PROFILES;

  const validationsMap = extractScoreValidations(person);
  const services = (person.records || []).filter(r => r.kind === 'service');

  return profilesToEvaluate.map(prof => {
    const validation = validationsMap[prof.code];
    const isConvalidated = Boolean(validation?.isConvalidated);
    const useValidatedScore = Boolean(validation?.useValidatedScore && isConvalidated);
    const isIncremental = Boolean(validation?.isIncrementalBase && useValidatedScore && validation?.consolidationDate);
    const cutoffDate = isIncremental && validation?.consolidationDate ? new Date(validation.consolidationDate) : null;

    const syMap = new Map<string, { days: number; specificScore: number; otherScore: number; startYear: number; endYear: number }>();
    let totalSpecificDays = 0;
    let totalOtherDays = 0;

    for (const s of services) {
      const isParitaria = (s.title + ' ' + (s.notes || '')).toLowerCase().includes('paritaria');
      const isDocente =
        s.profile === 'DOCENTE' || (s.title + ' ' + (s.notes || '')).toLowerCase().includes('docente');
      const mult = isParitaria ? 0.5 : 1.0;
      const isSpecific = !isDocente && s.profile === prof.code;
      let parsedNotes: Record<string, unknown> = {};
      try {
        if (s.notes?.startsWith('{')) parsedNotes = JSON.parse(s.notes);
      } catch {}
      const isRuoloRec = parsedNotes.isRuolo === true || parsedNotes.contractType === 'permanent';
      const isOngoing = !s.end || isRuoloRec;

      const segments = splitServiceBySchoolYears(s.start, isOngoing ? null : s.end, cutoffDate);
      for (const seg of segments) {
        if (!syMap.has(seg.schoolYear)) {
          syMap.set(seg.schoolYear, {
            days: 0,
            specificScore: 0,
            otherScore: 0,
            startYear: seg.startYear,
            endYear: seg.endYear,
          });
        }
        const item = syMap.get(seg.schoolYear)!;
        item.days += seg.days;

        if (isSpecific) {
          totalSpecificDays += seg.days;
          const rate = (prof.code === 'CS' || prof.code === 'OS' ? 0.50 : 0.60) * mult;
          item.specificScore += calculateMonths(seg.days) * rate;
        } else {
          totalOtherDays += seg.days;
          const rate = (prof.code === 'CS' || prof.code === 'OS' ? 0.15 : 0.10) * mult;
          item.otherScore += calculateMonths(seg.days) * rate;
        }
      }
    }

    const schoolYearBreakdown: SchoolYearServiceBreakdown[] = [];
    let aggregatedSpecific = 0;
    let aggregatedOther = 0;

    const sortedSchoolYears = Array.from(syMap.entries()).sort(
      (a, b) => b[1].startYear - a[1].startYear
    );

    for (const [sy, data] of sortedSchoolYears) {
      const months = calculateMonths(data.days);
      const rawTotal = data.specificScore + data.otherScore;
      const isCapped = rawTotal > 6.00;
      const cappedTotal = isCapped ? 6.00 : rawTotal;

      if (isCapped) {
        const ratio = data.specificScore / (rawTotal || 1);
        aggregatedSpecific += Math.round(cappedTotal * ratio * 100) / 100;
        aggregatedOther += Math.round(cappedTotal * (1 - ratio) * 100) / 100;
      } else {
        aggregatedSpecific += Math.round(data.specificScore * 100) / 100;
        aggregatedOther += Math.round(data.otherScore * 100) / 100;
      }

      schoolYearBreakdown.push({
        schoolYear: sy,
        startYear: data.startYear,
        endYear: data.endYear,
        days: data.days,
        months,
        specificScore: Math.round(data.specificScore * 100) / 100,
        otherScore: Math.round(data.otherScore * 100) / 100,
        totalAnnualScore: Math.round(rawTotal * 100) / 100,
        isCapped,
        cappedScore: Math.round(cappedTotal * 100) / 100,
      });
    }

    const accessQual = extractAccessQualification(person.records || [], prof.code);
    const baseAccessScore = isIncremental ? 0.0 : computeAccessScore(person.records || [], prof.code);
    const culturalScore = computeCulturalScore(
      person.records || [],
      prof.code,
      decree,
      accessQual?.id,
      isIncremental ? validation?.consolidationDate : undefined
    );

    const calculatedTotalScore = Math.round(
      (baseAccessScore + aggregatedSpecific + aggregatedOther + culturalScore) * 100
    ) / 100;

    let effectiveScore = calculatedTotalScore;
    let baseConsolidatedScore: number | undefined;
    let subsequentScore: number | undefined;

    if (useValidatedScore && typeof validation?.validatedScore === 'number') {
      if (isIncremental) {
        baseConsolidatedScore = validation.validatedScore;
        subsequentScore = calculatedTotalScore;
        effectiveScore = Math.round((baseConsolidatedScore + subsequentScore) * 100) / 100;
      } else {
        effectiveScore = validation.validatedScore;
      }
    }

    const hasCiad = checkHasCiad(person.records || []);
    const requiresCiad = prof.code !== 'CS';
    const isCiadCompliant = !requiresCiad || hasCiad;
    const ciadWarning = !isCiadCompliant
      ? 'Attenzione CIAD: Requisito di accesso obbligatorio (CCNL 18/01/2024 e DM 89/2024). Da acquisire entro il 30/04/2025 a pena di decadenza dalla graduatoria.'
      : undefined;

    return {
      code: prof.code,
      label: PROFILE_LABELS[prof.code] || prof.label,
      baseAccessScore,
      specificServiceScore: Math.round(aggregatedSpecific * 100) / 100,
      otherServiceScore: Math.round(aggregatedOther * 100) / 100,
      culturalScore,
      totalScore: calculatedTotalScore,
      serviceDays: totalSpecificDays + totalOtherDays,
      specificDays: totalSpecificDays,
      decree,
      requiresCiad,
      hasCiad,
      isCiadCompliant,
      ciadWarning,
      isConvalidated,
      useValidatedScore,
      validatedScore: validation?.validatedScore,
      effectiveScore: Math.round(effectiveScore * 100) / 100,
      validationDecree: validation?.decreeProtocol,
      validatingSchool: validation?.validatingSchool,
      validationDate: validation?.decreeDate,
      isIncrementalBase: isIncremental,
      consolidationDate: validation?.consolidationDate,
      baseConsolidatedScore,
      subsequentScore,
      subsequentDays: totalSpecificDays + totalOtherDays,
      schoolYearBreakdown,
    };
  });
}
