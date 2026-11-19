function getUtcDayDiff(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1;
}

export function parseDays(start: string, end: string | null, referenceDate?: Date): number {
  const dStart = new Date(start);
  if (isNaN(dStart.getTime())) return 1;
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const dEnd = end ? new Date(end) : now;
  if (isNaN(dEnd.getTime()) || dEnd < dStart) return 1;
  return getUtcDayDiff(dStart, dEnd);
}

export function calculateMonths(days: number): number {
  if (days <= 0) return 0;
  const fullMonths = Math.floor(days / 30);
  const remainder = days % 30;
  return fullMonths + (remainder > 15 ? 1 : 0);
}

export function splitServiceBySchoolYears(startStr: string, endStr: string | null, cutoffDate?: Date | null) {
  const results: { schoolYear: string; startYear: number; endYear: number; days: number }[] = [];
  let start = new Date(startStr);
  const now = new Date();
  const end = endStr ? new Date(endStr) : now;

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    const yr = start.getFullYear() || 2024;
    return [{ schoolYear: `${yr}/${yr + 1}`, startYear: yr, endYear: yr + 1, days: 1 }];
  }

  if (cutoffDate) {
    if (end <= cutoffDate) return [];
    if (start <= cutoffDate) {
      start = new Date(cutoffDate.getTime() + 86400000);
    }
  }

  let curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const cleanEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (curr <= cleanEnd) {
    const yr = curr.getFullYear();
    const m = curr.getMonth();
    const syStartYear = m >= 8 ? yr : yr - 1;
    const syEndYear = syStartYear + 1;
    const syEnd = new Date(syEndYear, 7, 31);

    const segmentEnd = cleanEnd < syEnd ? cleanEnd : syEnd;
    const daysInSegment = Math.max(1, getUtcDayDiff(curr, segmentEnd));
    const syLabel = `${syStartYear}/${syEndYear}`;

    results.push({ schoolYear: syLabel, startYear: syStartYear, endYear: syEndYear, days: daysInSegment });
    curr = new Date(syEndYear, 8, 1);
  }

  return results;
}
