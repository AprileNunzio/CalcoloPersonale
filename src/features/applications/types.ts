import { DirectoryEntry } from '../directory/DirectoryPicker';

export interface ApplicationData {
  triennium: string;
  profiles: string[];
  applicationType: 'insert' | 'update';
  submissionDate: string;
  protocol: string;
  province: string;
  headSchool?: DirectoryEntry | null;
  chosenSchools?: DirectoryEntry[];
  declaredAccess: string;
  declaredCultural: string;
  declaredServices: string;
  notes: string;
}

export const TRIENNIUMS = [
  '2024 - 2027 (D.M. 89/2024)',
  '2021 - 2024 (D.M. 50/2021)',
  '2017 - 2020 (D.M. 640/2017)',
  '2014 - 2017 (D.M. 717/2014)',
] as const;
