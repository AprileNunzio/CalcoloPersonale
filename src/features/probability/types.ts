export interface SchoolProbability {
  code: string;
  name: string;
  municipality: string;
  annualAssignmentProb: number;
  shortTermAssignmentProb: number;
  substituteCallProb: number;
  estimatedSchoolRank: number;
  totalCandidates: number;
  retirementsCurrentYear: number;
  retirementsNextYear: number;
  totalStaffPositions: number;
  opportunityIndex: number;
  dossierAssignments?: number;
  dossierDaysWorked?: number;
}

export interface ProbabilityAnalysisResult {
  province: string;
  profile: string;
  fascia: number;
  userScore: number;
  percentile: number;
  estimatedProvincialRank: number;
  totalProvincialCandidates: number;
  annualProb: number;
  shortTermProb: number;
  substituteProb: number;
  rankGainPerPoint: number;
  schools: SchoolProbability[];
  retirementsTotalProvinceCurrent: number;
  retirementsTotalProvinceNext: number;
  dossierServicesCount?: number;
  dossierDistinctWorkers?: number;
}

export interface ProbabilityRequest {
  province: string;
  profile: string;
  fascia: number;
  score: number;
  chosenSchoolCodes: string[];
}
