import { Person } from './types';

export interface ChildLeaveAnalysis {
  childId: string;
  childName: string;
  birthDate?: string | null;
  ageYears: number;
  ageMonths: number;
  isEligibleUnder12: boolean;
  deadline12Years?: string;
  parentAName: string;
  parentADays: number;
  hasOtherParent: boolean;
  otherParentName?: string;
  parentBDays: number;
  totalUsedDays: number;
  maxSharedDays: number;
  remainingDays: number;
  fatherBonusApplied: boolean;
  schoolPaid100RemainingDays: number;
  illnessRightsText: string;
  legalNote: string;
}

export interface SpouseBenefitAnalysis {
  memberId: string;
  fullName: string;
  birthDate?: string | null;
  marriageLeaveDays: number;
  personalLeaveDays: number;
  reunionScore: number;
  isDisability104: boolean;
  notesText?: string;
  legalNote: string;
}

export interface OtherFamilyBenefitAnalysis {
  memberId: string;
  fullName: string;
  relation: string;
  birthDate?: string | null;
  isDisability104: boolean;
  legalNote: string;
}

export interface ComprehensiveFamilyOverview {
  childrenLeaves: ChildLeaveAnalysis[];
  spouses: SpouseBenefitAnalysis[];
  others: OtherFamilyBenefitAnalysis[];
  totalEligibleChildren: number;
}

// Retain SharedLeaveResult interface for compatibility
export type SharedLeaveResult = ChildLeaveAnalysis;

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

export function calculateAgeDetailed(birthDateStr?: string | null): { years: number; months: number } | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
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

function computeDeadline12Years(birthDateStr?: string | null): string | undefined {
  if (!birthDateStr) return undefined;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return undefined;
  const deadline = new Date(birth.getFullYear() + 12, birth.getMonth(), birth.getDate());
  return deadline.toISOString().slice(0, 10);
}

function detectRelation(entry: { notes?: string; title?: string; start?: string }): 'spouse' | 'child' | 'parent' | 'other' {
  if (entry.notes) {
    try {
      if (entry.notes.startsWith('{')) {
        const parsed = JSON.parse(entry.notes);
        if (parsed.relation && ['spouse', 'child', 'parent', 'sibling', 'other'].includes(parsed.relation)) {
          return parsed.relation === 'sibling' ? 'other' : parsed.relation;
        }
      }
    } catch {
      // ignore
    }
    const lowerNotes = entry.notes.toLowerCase();
    if (lowerNotes.includes('moglie') || lowerNotes.includes('marito') || lowerNotes.includes('coniuge') || lowerNotes.includes('spouse') || lowerNotes.includes('partner')) {
      return 'spouse';
    }
    if (lowerNotes.includes('mamma') || lowerNotes.includes('papà') || lowerNotes.includes('padre') || lowerNotes.includes('madre') || lowerNotes.includes('genitore')) {
      return 'parent';
    }
  }

  // If age is >= 18 and no explicit relation, classify as spouse/adult rather than assuming a child
  if (entry.start) {
    const age = calculateAgeDetailed(entry.start);
    if (age && age.years >= 18) {
      return 'spouse';
    }
  }

  return 'child';
}

export function computeComprehensiveFamilyOverview(
  currentPerson: Person,
  allPeople: Person[],
): ComprehensiveFamilyOverview {
  const familyRecords = (currentPerson.records || []).filter(r => r.kind === 'child');
  const parentADays = getParentalDays(currentPerson);

  const childrenLeaves: ChildLeaveAnalysis[] = [];
  const spouses: SpouseBenefitAnalysis[] = [];
  const others: OtherFamilyBenefitAnalysis[] = [];

  for (const record of familyRecords) {
    const rel = detectRelation(record);

    let isDisability104 = false;
    let notesText = '';
    let linkedPersonId: string | null = null;
    try {
      if (record.notes && record.notes.startsWith('{')) {
        const parsed = JSON.parse(record.notes);
        isDisability104 = !!parsed.isDisability104;
        notesText = parsed.notesText || parsed.text || '';
        linkedPersonId = parsed.linkedPersonId || null;
      } else {
        notesText = record.notes || '';
      }
    } catch {
      notesText = record.notes || '';
    }

    if (rel === 'spouse') {
      spouses.push({
        memberId: record.id,
        fullName: record.title,
        birthDate: record.start,
        marriageLeaveDays: 15,
        personalLeaveDays: 3,
        reunionScore: 6,
        isDisability104,
        notesText,
        legalNote:
          'Coniuge/Partner registrato. Il congedo parentale (D.Lgs. 151/2001) è riservato esclusivamente alla cura dei figli. Per il coniuge spettano: Congedo matrimoniale (15 gg retribuiti), permessi retribuiti per motivi personali o familiari (3 gg/anno + 6 gg ferie) e punteggio per ricongiungimento al coniuge (+6 punti mobilità/graduatorie d’istituto).',
      });
      continue;
    }

    if (rel === 'parent' || rel === 'other') {
      others.push({
        memberId: record.id,
        fullName: record.title,
        relation: rel === 'parent' ? 'Genitore' : 'Familiare convivente',
        birthDate: record.start,
        isDisability104,
        legalNote: isDisability104
          ? 'Beneficiario Legge 104/92: diritto a 3 giorni mensili di permesso retribuito e congedo straordinario biennale (D.Lgs. 151/2001 art. 42).'
          : 'Familiare a carico o convivente per agevolazioni fiscali e detrazioni.',
      });
      continue;
    }

    // It's a child: calculate exact age and legal applicability under D.Lgs. 151/2001
    const age = calculateAgeDetailed(record.start);
    const ageYears = age ? age.years : 0;
    const ageMonths = age ? age.months : 0;
    const isEligibleUnder12 = ageYears < 12;
    const deadline12Years = computeDeadline12Years(record.start);

    // Other parent matching
    let otherParent = allPeople.find(p => p.id === linkedPersonId && p.id !== currentPerson.id);
    if (!otherParent) {
      otherParent = allPeople.find(p => {
        if (p.id === currentPerson.id) return false;
        return (p.records || []).some(
          r => r.kind === 'child' && r.title.trim().toLowerCase() === record.title.trim().toLowerCase(),
        );
      });
    }

    const parentBDays = otherParent ? getParentalDays(otherParent) : 0;
    const isCurrentFather = currentPerson.gender === 'male';
    const isOtherFather = otherParent?.gender === 'male';
    const fatherDays = isCurrentFather ? parentADays : isOtherFather ? parentBDays : 0;
    const fatherBonusApplied = fatherDays >= 90;

    let maxSharedDays = isEligibleUnder12 ? (fatherBonusApplied ? 330 : 300) : 0;
    let totalUsedDays = parentADays + parentBDays;
    let remainingDays = isEligibleUnder12 ? Math.max(0, maxSharedDays - totalUsedDays) : 0;

    // School paid at 100% leave (primi 30 giorni nel comparto scuola art. 34 CCNL)
    const schoolPaid100RemainingDays = isEligibleUnder12 ? Math.max(0, 30 - totalUsedDays) : 0;

    let illnessRightsText = '';
    let legalNote = '';

    if (!isEligibleUnder12) {
      illnessRightsText = 'Non spettante (superati gli 8 anni di vita).';
      legalNote = `Età del figlio: ${ageYears} anni. Ai sensi dell'art. 32 del D.Lgs. 151/2001, il congedo parentale spetta esclusivamente fino al compimento del 12° anno di vita. Il termine per la fruizione è superato.`;
    } else {
      if (ageYears < 3) {
        illnessRightsText =
          'Malattia bambino: giorni illimitati per entrambi i genitori alternativamente (primi 30 giorni all’anno retribuiti al 100% ai sensi del CCNL Scuola).';
      } else if (ageYears < 8) {
        illnessRightsText =
          'Malattia bambino: 5 giorni lavorativi all’anno per ciascun genitore (non retribuiti ma con contribuzione figurativa).';
      } else {
        illnessRightsText =
          'Malattia bambino: diritto non più spettante (> 8 anni). Congedo parentale ancora attivo fino a 12 anni.';
      }

      legalNote = `Diritto attivo fino al compimento dei 12 anni (${deadline12Years || 'entro il 12° compleanno'}). Limite massimo di coppia: ${maxSharedDays} giorni (10 mesi complessivi, elevabili a 11 mesi con almeno 3 mesi fruiti dal padre). Primi 30 giorni retribuiti al 100% nel comparto scuola.`;
    }

    childrenLeaves.push({
      childId: record.id,
      childName: record.title,
      birthDate: record.start,
      ageYears,
      ageMonths,
      isEligibleUnder12,
      deadline12Years,
      parentAName: `${currentPerson.lastName} ${currentPerson.firstName}`,
      parentADays,
      hasOtherParent: !!otherParent,
      otherParentName: otherParent ? `${otherParent.lastName} ${otherParent.firstName}` : undefined,
      parentBDays,
      totalUsedDays,
      maxSharedDays,
      remainingDays,
      fatherBonusApplied,
      schoolPaid100RemainingDays,
      illnessRightsText,
      legalNote,
    });
  }

  return {
    childrenLeaves,
    spouses,
    others,
    totalEligibleChildren: childrenLeaves.filter(c => c.isEligibleUnder12).length,
  };
}

export function computeSharedFamilyLeave(currentPerson: Person, allPeople: Person[]): SharedLeaveResult[] {
  const overview = computeComprehensiveFamilyOverview(currentPerson, allPeople);
  return overview.childrenLeaves;
}
