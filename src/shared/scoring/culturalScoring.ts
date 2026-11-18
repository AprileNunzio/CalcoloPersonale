import { Entry } from '../types';
import { MinisterialDecree } from './scoringTypes';

export function computeCulturalScore(
  records: Entry[],
  profileCode: string,
  decree: MinisterialDecree,
  accessQualId?: string,
  minDateStr?: string
): number {
  let score = 0;
  const cutoff = minDateStr ? new Date(minDateStr) : null;
  const quals = (records || []).filter(r => {
    if (r.kind !== 'qualification' || r.id === accessQualId) return false;
    if (cutoff && r.start) {
      const d = new Date(r.start);
      if (!isNaN(d.getTime()) && d <= cutoff) return false;
    }
    return true;
  });

  const hasDigital = quals.some(q => {
    const t = (q.title + ' ' + (q.notes || '')).toLowerCase();
    return (
      t.includes('alfabetizzazione') ||
      t.includes('ciad') ||
      t.includes('ecdl') ||
      t.includes('eipass') ||
      t.includes('digcomp') ||
      t.includes('informatica')
    );
  });

  if (hasDigital) {
    score += profileCode === 'CS' ? 0.30 : 0.60;
  }

  if (profileCode === 'AA') {
    if (quals.some(q => q.title.toLowerCase().includes('dattilografia'))) score += 1.0;
    if (quals.some(q => q.title.toLowerCase().includes('laurea'))) score += 2.0;
  } else if (profileCode === 'AT') {
    if (quals.some(q => q.title.toLowerCase().includes('laurea'))) score += 2.0;
  } else if (profileCode === 'OS') {
    if (decree === 'DM_89_2024' && quals.some(q => {
      const t = q.title.toLowerCase();
      return t.includes('oss') || t.includes('osa') || t.includes('socio');
    })) score += 1.0;
  }

  return Math.round(score * 100) / 100;
}
