export interface AbsenceStatutoryDetail {
  kind: string;
  titleKey: string;
  daysAllowedKey: string;
  economicTreatmentKey: string;
  documentationKey: string;
  legalReference: string;
  summaryKey: string;
}

export const ABSENCE_STATUTORY_DATA: Record<string, AbsenceStatutoryDetail> = {
  sickness: {
    kind: 'sickness',
    titleKey: 'sickness',
    daysAllowedKey: 'sicknessDaysAllowed',
    economicTreatmentKey: 'sicknessSalaryInfo',
    documentationKey: 'sicknessDocInfo',
    legalReference: 'Art. 67 CCNL Istruzione e Ricerca 2019-2021',
    summaryKey: 'sicknessSummary',
  },
  specialist: {
    kind: 'specialist',
    titleKey: 'specialistVisits',
    daysAllowedKey: 'specialistDaysAllowed',
    economicTreatmentKey: 'specialistSalaryInfo',
    documentationKey: 'specialistDocInfo',
    legalReference: 'Art. 69 CCNL Istruzione e Ricerca 2019-2021',
    summaryKey: 'specialistSummary',
  },
  parental: {
    kind: 'parental',
    titleKey: 'parental',
    daysAllowedKey: 'parentalDaysAllowed',
    economicTreatmentKey: 'parentalSalaryInfo',
    documentationKey: 'parentalDocInfo',
    legalReference: 'D.Lgs. 151/2001 e Art. 34 CCNL 2019-2021',
    summaryKey: 'parentalSummary',
  },
  holiday: {
    kind: 'holiday',
    titleKey: 'holiday',
    daysAllowedKey: 'holidayDaysAllowed',
    economicTreatmentKey: 'holidaySalaryInfo',
    documentationKey: 'holidayDocInfo',
    legalReference: 'Art. 13 CCNL 2007 e Art. 66 CCNL 2019-2021',
    summaryKey: 'holidaySummary',
  },
  festivity: {
    kind: 'festivity',
    titleKey: 'festivity',
    daysAllowedKey: 'festivityDaysAllowed',
    economicTreatmentKey: 'festivitySalaryInfo',
    documentationKey: 'festivityDocInfo',
    legalReference: 'Legge 937/1977',
    summaryKey: 'festivitySummary',
  },
  bereavement: {
    kind: 'bereavement',
    titleKey: 'bereavement',
    daysAllowedKey: 'bereavementDaysAllowed',
    economicTreatmentKey: 'bereavementSalaryInfo',
    documentationKey: 'bereavementDocInfo',
    legalReference: 'Art. 67 co. 1 CCNL 2019-2021',
    summaryKey: 'bereavementSummary',
  },
  personal: {
    kind: 'personal',
    titleKey: 'personalLeave',
    daysAllowedKey: 'personalDaysAllowed',
    economicTreatmentKey: 'personalSalaryInfo',
    documentationKey: 'personalDocInfo',
    legalReference: 'Art. 67 co. 2 CCNL 2019-2021',
    summaryKey: 'personalSummary',
  },
  law104: {
    kind: 'law104',
    titleKey: 'law104Leave',
    daysAllowedKey: 'law104DaysAllowed',
    economicTreatmentKey: 'law104SalaryInfo',
    documentationKey: 'law104DocInfo',
    legalReference: 'Art. 33 L. 104/1992 e Art. 68 CCNL 2019-2021',
    summaryKey: 'law104Summary',
  },
  blood: {
    kind: 'blood',
    titleKey: 'blood',
    daysAllowedKey: 'bloodDaysAllowed',
    economicTreatmentKey: 'bloodSalaryInfo',
    documentationKey: 'bloodDocInfo',
    legalReference: 'Legge 219/2005 e Art. 1 D.M. 08/04/1968',
    summaryKey: 'bloodSummary',
  },
  study: {
    kind: 'study',
    titleKey: 'studyLeave',
    daysAllowedKey: 'studyDaysAllowed',
    economicTreatmentKey: 'studySalaryInfo',
    documentationKey: 'studyDocInfo',
    legalReference: 'Art. 3 DPR 395/1988 e Contrattazione Regionale',
    summaryKey: 'studySummary',
  },
  marriage: {
    kind: 'marriage',
    titleKey: 'marriageLeave',
    daysAllowedKey: 'marriageDaysAllowed',
    economicTreatmentKey: 'marriageSalaryInfo',
    documentationKey: 'marriageDocInfo',
    legalReference: 'Art. 15 co. 3 CCNL 2007',
    summaryKey: 'marriageSummary',
  },
  other: {
    kind: 'other',
    titleKey: 'other',
    daysAllowedKey: 'otherDaysAllowed',
    economicTreatmentKey: 'otherSalaryInfo',
    documentationKey: 'otherDocInfo',
    legalReference: 'Disposizioni generali TU Pubblico Impiego',
    summaryKey: 'otherSummary',
  },
};
