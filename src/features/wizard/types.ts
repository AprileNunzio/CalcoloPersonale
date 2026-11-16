import { Person, Archive } from '../../shared/types';

export interface WizardServiceItem {
  id: string;
  schoolName: string;
  isStatale: boolean;
  profile: string;
  start: string;
  end: string;
  monthsCalculated: number;
  pointsCalculated: number;
}

export interface FirstSetupWizardProps {
  person?: Person | null;
  allPeople: Person[];
  onComplete: (savedPerson: Person, archive: Archive) => void;
  onCancel: () => void;
  busy: boolean;
}
