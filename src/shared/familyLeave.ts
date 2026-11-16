import { Person } from './types';

export interface SharedLeaveResult {
  childName: string;
  birthDate?: string | null;
  parentAName: string;
  parentADays: number;
  hasOtherParent: boolean;
  otherParentName?: string;
  parentBDays: number;
  totalUsedDays: number;
  maxSharedDays: number;
  remainingDays: number;
  fatherBonusApplied: boolean;
}

function calculateDaysBetween(start: string, end: string | null): number {
  const d1 = new Date(start);
  const d2 = end ? new Date(end) : new Date(start);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 1;
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function getParentalDays(person: Person): number {
  return (person.records || [])
    .filter(r => r.kind === 'parental')
    .reduce((total, r) => total + calculateDaysBetween(r.start, r.end), 0);
}

export function computeSharedFamilyLeave(currentPerson: Person, allPeople: Person[]): SharedLeaveResult[] {
  const children = (currentPerson.records || []).filter(r => r.kind === 'child');
  const parentADays = getParentalDays(currentPerson);

  return children.map(child => {
    let linkedPersonId: string | null = null;
    try {
      if (child.notes && child.notes.startsWith('{')) {
        const parsed = JSON.parse(child.notes);
        linkedPersonId = parsed.linkedPersonId || null;
      }
    } catch {
      linkedPersonId = null;
    }

    let otherParent = allPeople.find(p => p.id === linkedPersonId && p.id !== currentPerson.id);

    if (!otherParent) {
      otherParent = allPeople.find(p => {
        if (p.id === currentPerson.id) return false;
        return (p.records || []).some(
          r => r.kind === 'child' && r.title.trim().toLowerCase() === child.title.trim().toLowerCase(),
        );
      });
    }

    const parentBDays = otherParent ? getParentalDays(otherParent) : 0;
    const isCurrentFather = currentPerson.gender === 'male';
    const isOtherFather = otherParent?.gender === 'male';
    const fatherDays = isCurrentFather ? parentADays : isOtherFather ? parentBDays : 0;
    const fatherBonusApplied = fatherDays >= 90;
    const maxSharedDays = fatherBonusApplied ? 330 : 300;
    const totalUsedDays = parentADays + parentBDays;
    const remainingDays = Math.max(0, maxSharedDays - totalUsedDays);

    return {
      childName: child.title,
      birthDate: child.start,
      parentAName: `${currentPerson.lastName} ${currentPerson.firstName}`,
      parentADays,
      hasOtherParent: !!otherParent,
      otherParentName: otherParent ? `${otherParent.lastName} ${otherParent.firstName}` : undefined,
      parentBDays,
      totalUsedDays,
      maxSharedDays,
      remainingDays,
      fatherBonusApplied,
    };
  });
}
