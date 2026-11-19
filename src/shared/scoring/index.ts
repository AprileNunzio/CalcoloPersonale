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

    const syMap = new Map<string, {
      days: number;
      specificDays: number;
      otherDays: number;
      startYear: number;
      endYear: number;
    }>();

    let totalSpecificDays = 0;
    let totalOtherDays = 0;

    // Normalizziamo i servizi per evitare sovrapposizioni spurie (es. Art. 59 o multipli ruoli)
    const normalizedServices = services.map(s => {
      let parsedNotes: Record<string, unknown> = {};
      try {
        if (s.notes?.startsWith('{')) parsedNotes = JSON.parse(s.notes);
      } catch {}
      const isRuoloRec = parsedNotes.isRuolo === true || parsedNotes.contractType === 'permanent';
      let effectiveEnd = s.end;

      if (!effectiveEnd && isRuoloRec) {
        // Se c'è un'immissione in ruolo successiva in altro profilo, chiudi il precedente
        const subsequentRole = services.find(other => {
          if (other.id === s.id) return false;
          let oNotes: Record<string, unknown> = {};
          try {
            if (other.notes?.startsWith('{')) oNotes = JSON.parse(other.notes);
          } catch {}
          return (oNotes.isRuolo === true || oNotes.contractType === 'permanent') && other.start > s.start;
        });

        if (subsequentRole) {
          const subDate = new Date(subsequentRole.start);
          subDate.setDate(subDate.getDate() - 1);
          effectiveEnd = subDate.toISOString().slice(0, 10);
        }
      }

      return {
        ...s,
        end: effectiveEnd,
      };
    });

    for (const s of normalizedServices) {
      const isParitaria = (s.title + ' ' + (s.notes || '')).toLowerCase().includes('paritaria');
      const isDocente =
        s.profile === 'DOCENTE' || (s.title + ' ' + (s.notes || '')).toLowerCase().includes('docente');
      const mult = isParitaria ? 0.5 : 1.0;
      const isSpecific = !isDocente && s.profile === prof.code;

      const segments = splitServiceBySchoolYears(s.start, s.end || null, cutoffDate);
      for (const seg of segments) {
        if (!syMap.has(seg.schoolYear)) {
          syMap.set(seg.schoolYear, {
            days: 0,
            specificDays: 0,
            otherDays: 0,
            startYear: seg.startYear,
            endYear: seg.endYear,
          });
        }
        const item = syMap.get(seg.schoolYear)!;
        const cappedSegDays = Math.min(366, seg.days);

        if (isSpecific) {
          item.specificDays = Math.min(366, item.specificDays + Math.round(cappedSegDays * mult));
          totalSpecificDays += cappedSegDays;
        } else {
          item.otherDays = Math.min(366, item.otherDays + Math.round(cappedSegDays * mult));
          totalOtherDays += cappedSegDays;
        }
        item.days = Math.min(366, item.specificDays + item.otherDays);
      }
    }

    const schoolYearBreakdown: SchoolYearServiceBreakdown[] = [];
    let aggregatedSpecific = 0;
    let aggregatedOther = 0;

    const sortedSchoolYears = Array.from(syMap.entries()).sort(
      (a, b) => b[1].startYear - a[1].startYear
    );

    const specificRate = prof.code === 'CS' || prof.code === 'OS' ? 0.50 : 0.60;
    const otherRate = prof.code === 'CS' || prof.code === 'OS' ? 0.15 : 0.10;
    const maxOtherAllowed = prof.code === 'CS' || prof.code === 'OS' ? 1.80 : 1.20;

    for (const [sy, data] of sortedSchoolYears) {
      const specificMonths = calculateMonths(data.specificDays);
      const otherMonths = calculateMonths(data.otherDays);
      const totalMonths = calculateMonths(data.days);

      let specificScore = Math.min(6.00, Math.round(specificMonths * specificRate * 100) / 100);
      let otherScore = Math.min(maxOtherAllowed, Math.round(otherMonths * otherRate * 100) / 100);

      const rawTotal = Math.round((specificScore + otherScore) * 100) / 100;
      const isCapped = rawTotal > 6.00;

      if (isCapped) {
        otherScore = Math.max(0, Math.round((6.00 - specificScore) * 100) / 100);
      }

      const cappedTotal = isCapped ? 6.00 : rawTotal;

      aggregatedSpecific += specificScore;
      aggregatedOther += otherScore;

      schoolYearBreakdown.push({
        schoolYear: sy,
        startYear: data.startYear,
        endYear: data.endYear,
        days: data.days,
        months: totalMonths,
        specificScore,
        otherScore,
        totalAnnualScore: rawTotal,
        isCapped,
        cappedScore: cappedTotal,
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

    let previousTrienniumScore = 0.0;
    for (const r of person.records || []) {
      if (r.kind === 'application' || r.kind === 'validation') {
        try {
          if (r.notes && r.notes.startsWith('{')) {
            const p = JSON.parse(r.notes);
            if (typeof p.punteggioTriennioPrecedente === 'number') {
              previousTrienniumScore = p.punteggioTriennioPrecedente;
            } else if (typeof p.precedingTrienniumScore === 'number') {
              previousTrienniumScore = p.precedingTrienniumScore;
            } else if (p.previousScores && typeof p.previousScores[prof.code] === 'number') {
              previousTrienniumScore = p.previousScores[prof.code];
            }
          }
        } catch {}
      }
    }

    const calculatedTotalScore = Math.round(
      (baseAccessScore + previousTrienniumScore + aggregatedSpecific + aggregatedOther + culturalScore) * 100
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
      previousTrienniumScore,
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
