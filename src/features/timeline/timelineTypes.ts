export type MilestoneStatus = 'completed' | 'active_countdown' | 'upcoming' | 'expired';

export type DeadlineUrgency = 'critical_red' | 'warning_amber' | 'good_green' | 'neutral';

export interface TimelineDeadline {
  id: string;
  type: 'naspi' | 'graduatorie24m' | 'contract_end' | 'comporto_sickness';
  title: string;
  targetDate: string; // ISO yyyy-mm-dd
  daysRemaining: number;
  status: MilestoneStatus;
  badge: string;
  description: string;
  actionNote: string;
  progressPercent?: number;
  urgency: DeadlineUrgency;
  legalReference: string;
}

export interface ActiveContractInfo {
  schoolName: string;
  profile: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalDurationDays: number;
  progressPercent: number;
}

export interface Profile24MesiStatus {
  profileCode: string;
  profileLabel: string;
  specificDays: number;
  otherAtaDays: number;
  docenteDays: number;
  totalValidDays: number;
  targetDays: number;
  percent: number;
  isReached: boolean;
  daysRemaining: number;
  projectedWindow: string;
}

export interface TimelineData {
  deadlines: TimelineDeadline[];
  totalStataleDays: number;
  daysTo24Mesi: number;
  is24MesiReached: boolean;
  percent24Mesi: number;
  profile24MesiList: Profile24MesiStatus[];
  naspiDaysRemaining: number | null;
  naspiWindowOpen: boolean;
  isPersonRuolo: boolean;
  activeContract: ActiveContractInfo | null;
  lastContractEndDate: string | null;
}
