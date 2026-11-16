import { Entry } from '../../shared/types';
import { FamilyMemberData, FamilyRelation, FamilyStatistics } from './types';

export function parseFamilyMember(entry: Entry): FamilyMemberData {
  let relation: FamilyRelation = 'child';
  let fiscalCode = '';
  let dependentPercentage = entry.amount ?? 100;
  let isDisability104 = false;
  let linkedPersonId: string | undefined = undefined;
  let notesText = '';

  if (entry.notes) {
    if (entry.notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(entry.notes);
        if (parsed.relation && ['spouse', 'child', 'parent', 'sibling', 'other'].includes(parsed.relation)) {
          relation = parsed.relation;
        }
        if (parsed.fiscalCode) fiscalCode = parsed.fiscalCode;
        if (typeof parsed.dependentPercentage === 'number') dependentPercentage = parsed.dependentPercentage;
        if (typeof parsed.isDisability104 === 'boolean') isDisability104 = parsed.isDisability104;
        if (parsed.linkedPersonId) linkedPersonId = parsed.linkedPersonId;
        if (parsed.notesText) notesText = parsed.notesText;
        else if (parsed.text) notesText = parsed.text;
      } catch {
        notesText = entry.notes;
      }
    } else {
      notesText = entry.notes;
    }
  }

  return {
    id: entry.id,
    relation,
    fullName: entry.title,
    birthDate: entry.start || '',
    fiscalCode,
    dependentPercentage,
    isDisability104,
    linkedPersonId,
    notesText,
    rawEntry: entry,
  };
}

export function serializeFamilyMember(data: {
  id?: string;
  relation: FamilyRelation;
  fullName: string;
  birthDate: string;
  fiscalCode?: string;
  dependentPercentage: number;
  isDisability104: boolean;
  linkedPersonId?: string;
  notesText?: string;
}): Entry {
  const payload = {
    relation: data.relation,
    fiscalCode: data.fiscalCode?.trim().toUpperCase() || '',
    dependentPercentage: data.dependentPercentage,
    isDisability104: data.isDisability104,
    linkedPersonId: data.linkedPersonId || null,
    notesText: data.notesText?.trim() || '',
  };

  return {
    id: data.id || crypto.randomUUID(),
    kind: 'child',
    title: data.fullName.trim(),
    start: data.birthDate,
    end: null,
    amount: data.dependentPercentage,
    notes: JSON.stringify(payload),
    profile: null,
    school: null,
  };
}

export function calculateAge(birthDate: string): { years: number; months: number } | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

export function calculateFamilyStatistics(members: FamilyMemberData[]): FamilyStatistics {
  let dependentChildrenCount = 0;
  let spouseCount = 0;
  let disability104Count = 0;
  let childrenUnder3Count = 0;
  let childrenUnder12Count = 0;

  for (const m of members) {
    if (m.relation === 'spouse') {
      spouseCount++;
    }
    if (m.relation === 'child') {
      if (m.dependentPercentage > 0) {
        dependentChildrenCount++;
      }
      const age = calculateAge(m.birthDate);
      if (age) {
        if (age.years < 3) childrenUnder3Count++;
        if (age.years < 12) childrenUnder12Count++;
      }
    }
    if (m.isDisability104) {
      disability104Count++;
    }
  }

  const hasAtaPreference = dependentChildrenCount > 0;

  return {
    totalMembers: members.length,
    dependentChildrenCount,
    spouseCount,
    disability104Count,
    childrenUnder3Count,
    childrenUnder12Count,
    hasAtaPreference,
  };
}
