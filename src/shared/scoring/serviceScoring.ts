export function parseDays(start: string, end: string | null): number {
  const dStart = new Date(start);
  const dEnd = end ? new Date(end) : new Date(start);
  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()) || dEnd < dStart) return 1;
  const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
  const end = endStr ? new Date(endStr) : new Date(startStr);

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

  let curr = new Date(start);
  while (curr <= end) {
    const yr = curr.getFullYear();
    const m = curr.getMonth();
    const syStartYear = m >= 8 ? yr : yr - 1;
    const syEndYear = syStartYear + 1;
    const syEnd = new Date(syEndYear, 7, 31, 23, 59, 59);

    const segmentEnd = end < syEnd ? end : syEnd;
    const diff = Math.ceil(Math.abs(segmentEnd.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const syLabel = `${syStartYear}/${syEndYear}`;

    results.push({ schoolYear: syLabel, startYear: syStartYear, endYear: syEndYear, days: Math.max(1, diff) });
    curr = new Date(syEndYear, 8, 1);
  }

  return results;
}
