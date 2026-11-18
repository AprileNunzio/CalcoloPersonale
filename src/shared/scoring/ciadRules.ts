import { Entry } from '../types';

export function checkHasCiad(records: Entry[]): boolean {
  return (records || []).some(r => {
    if (r.kind !== 'qualification') return false;
    const t = ((r.title || '') + ' ' + (r.notes || '')).toLowerCase();
    return (
      t.includes('ciad') ||
      t.includes('alfabetizzazione') ||
      (t.includes('digcomp') && (t.includes('user') || t.includes('accredia'))) ||
      (t.includes('eipass') && t.includes('standard')) ||
      (t.includes('icdl') && (t.includes('full') || t.includes('standard')))
    );
  });
}
