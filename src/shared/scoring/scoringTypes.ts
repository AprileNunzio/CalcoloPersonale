import { Entry } from '../types';

export type MinisterialDecree = 'DM_89_2024' | 'DM_50_2021' | 'DM_640_2017';

export interface SchoolYearServiceBreakdown {
  schoolYear: string;
  startYear: number;
  endYear: number;
  days: number;
  months: number;
  specificScore: number;
  otherScore: number;
  totalAnnualScore: number;
  isCapped: boolean;
  cappedScore: number;
}

export interface ScoreValidationDecreeItem {
  id: string;
  decreeProtocol: string;
  decreeDate: string;
  validatingSchool: string;
  validatedScore: number;
  schoolYearOrTriennium: string;
  notes?: string;
}

export interface ScoreValidationData {
  profileCode: string;
  isConvalidated: boolean;
  validatedScore: number;
  useValidatedScore: boolean;
  decreeProtocol: string;
  decreeDate: string;
  validatingSchool: string;
  isIncrementalBase?: boolean;
  consolidationDate?: string;
  decreeHistory?: ScoreValidationDecreeItem[];
  notes?: string;
  lastUpdated?: string;
}

export interface ProfileScore {
  code: string;
  label: string;
  baseAccessScore: number;
  specificServiceScore: number;
  otherServiceScore: number;
  culturalScore: number;
  totalScore: number;
  serviceDays: number;
  specificDays: number;
  decree: MinisterialDecree;
  requiresCiad: boolean;
  hasCiad: boolean;
  isCiadCompliant: boolean;
  ciadWarning?: string;
  isConvalidated: boolean;
  useValidatedScore: boolean;
  validatedScore?: number;
  effectiveScore: number;
  validationDecree?: string;
  validatingSchool?: string;
  validationDate?: string;
  isIncrementalBase?: boolean;
  consolidationDate?: string;
  baseConsolidatedScore?: number;
  subsequentScore?: number;
  subsequentDays?: number;
  schoolYearBreakdown: SchoolYearServiceBreakdown[];
}
