import { Entry } from '../../shared/types';

export type FamilyRelation = 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

export interface FamilyMemberData {
  id: string;
  relation: FamilyRelation;
  fullName: string;
  birthDate: string;
  fiscalCode: string;
  dependentPercentage: number;
  isDisability104: boolean;
  linkedPersonId?: string;
  notesText?: string;
  rawEntry: Entry;
}

export interface FamilyStatistics {
  totalMembers: number;
  dependentChildrenCount: number;
  spouseCount: number;
  disability104Count: number;
  childrenUnder3Count: number;
  childrenUnder12Count: number;
  hasAtaPreference: boolean;
}
