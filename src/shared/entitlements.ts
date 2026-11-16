import { Person } from './types';

export type ContractType = 'permanent' | 'annual' | 'short';

export interface EntitlementResult {
  contractType: ContractType;
  totalComportoDays: number;
  usedSicknessDays: number;
  remainingComportoDays: number;
  totalSpecialistHours: number;
  usedSpecialistHours: number;
  remainingSpecialistHours: number;
  bracket1DaysUsed: number;
  bracket1Max: number;
  bracket2DaysUsed: number;
  bracket2Max: number;
  bracket3DaysUsed: number;
  bracket3Max: number;
  isOverComporto: boolean;
}

function calculateDays(start: string, end: string | null): number {
  const d1 = new Date(start);
  const d2 = end ? new Date(end) : new Date(start);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 1;
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function detectContractType(person: Person): ContractType {
  const services = (person.records || [])
    .filter(r => r.kind === 'service')
    .sort((a, b) => (b.end || b.start || '').localeCompare(a.end || a.start || ''));

  if (services.length === 0) return 'annual';
  const latest = services[0];
  const t = (latest.title + ' ' + (latest.notes || '')).toLowerCase();

  if (t.includes('ruolo') || t.includes('indeterminato')) {
    return 'permanent';
  }
  if (t.includes('breve') || t.includes('saltuaria') || t.includes('termine lezioni')) {
    return 'short';
  }
  return 'annual';
}

export function calculateEntitlements(person: Person, overrideContract?: ContractType): EntitlementResult {
  const contractType = overrideContract || detectContractType(person);
  const records = person.records || [];

  let usedSicknessDays = 0;
  let usedSpecialistHours = 0;

  for (const r of records) {
    if (r.kind === 'sickness') {
      const days = calculateDays(r.start, r.end);
      const isVisit = (r.title + ' ' + r.notes).toLowerCase().includes('visita');
      if (isVisit) {
        usedSpecialistHours += r.amount && r.amount > 0 ? r.amount : days * 6;
      } else {
        usedSicknessDays += days;
      }
    }
  }

  let totalComportoDays = 540;
  let bracket1Max = 270;
  let bracket2Max = 90;
  let bracket3Max = 180;
  let totalSpecialistHours = 18;

  if (contractType === 'annual') {
    totalComportoDays = 270;
    bracket1Max = 30;
    bracket2Max = 60;
    bracket3Max = 180;
    totalSpecialistHours = 18;
  } else if (contractType === 'short') {
    totalComportoDays = 30;
    bracket1Max = 0;
    bracket2Max = 30;
    bracket3Max = 0;
    totalSpecialistHours = 6;
  }

  const bracket1DaysUsed = Math.min(usedSicknessDays, bracket1Max);
  const remainingAfterB1 = Math.max(0, usedSicknessDays - bracket1Max);
  const bracket2DaysUsed = Math.min(remainingAfterB1, bracket2Max);
  const remainingAfterB2 = Math.max(0, remainingAfterB1 - bracket2Max);
  const bracket3DaysUsed = Math.min(remainingAfterB2, bracket3Max);

  const remainingComportoDays = Math.max(0, totalComportoDays - usedSicknessDays);
  const remainingSpecialistHours = Math.max(0, totalSpecialistHours - usedSpecialistHours);
  const isOverComporto = usedSicknessDays > totalComportoDays;

  return {
    contractType,
    totalComportoDays,
    usedSicknessDays,
    remainingComportoDays,
    totalSpecialistHours,
    usedSpecialistHours,
    remainingSpecialistHours,
    bracket1DaysUsed,
    bracket1Max,
    bracket2DaysUsed,
    bracket2Max,
    bracket3DaysUsed,
    bracket3Max,
    isOverComporto,
  };
}
