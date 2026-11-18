export function formatDateItalian(
  dateStr?: string | null,
  includeWeekday = true
): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const options: Intl.DateTimeFormatOptions = includeWeekday
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'long', year: 'numeric' };
      const formatted = new Intl.DateTimeFormat('it-IT', options).format(d);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  }
  return dateStr;
}

export function formatDateItalianShort(dateStr?: string | null): string {
  return formatDateItalian(dateStr, false);
}
