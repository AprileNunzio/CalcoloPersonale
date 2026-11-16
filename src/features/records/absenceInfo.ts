export interface ContractSpecificAbsence {
  daysAllowedKey: string;
  economicTreatmentKey: string;
  retentionKey: string;
}

export interface AbsenceStatutoryDetail {
  kind: string;
  titleKey: string;
  legalReference: string;
  summaryKey: string;
  documentationKey: string;
  visiteFiscaliKey?: string;
  decurtazioneBrunettaKey?: string;
  commonAllContractsKey?: string;
  permanent: ContractSpecificAbsence;
  annual: ContractSpecificAbsence;
  short: ContractSpecificAbsence;
}

export const ABSENCE_STATUTORY_DATA: Record<string, AbsenceStatutoryDetail> = {
  sickness: {
    kind: 'sickness',
    titleKey: 'sickness',
    legalReference: 'Art. 67-70 CCNL Istruzione e Ricerca 2019-2021',
    summaryKey: 'sicknessSummary',
    documentationKey: 'sicknessDocInfo',
    visiteFiscaliKey: 'visiteFiscaliDetails',
    decurtazioneBrunettaKey: 'brunettaCutDesc',
    permanent: {
      daysAllowedKey: 'sicknessPermDays',
      economicTreatmentKey: 'sicknessPermSalary',
      retentionKey: 'sicknessPermRetention',
    },
    annual: {
      daysAllowedKey: 'sicknessAnnualDays',
      economicTreatmentKey: 'sicknessAnnualSalary',
      retentionKey: 'sicknessAnnualRetention',
    },
    short: {
      daysAllowedKey: 'sicknessShortDays',
      economicTreatmentKey: 'sicknessShortSalary',
      retentionKey: 'sicknessShortRetention',
    },
  },
  specialist: {
    kind: 'specialist',
    titleKey: 'specialistVisits',
    legalReference: 'Art. 69 CCNL Istruzione e Ricerca 2019-2021',
    summaryKey: 'specialistSummary',
    documentationKey: 'specialistDocInfo',
    permanent: {
      daysAllowedKey: 'specialistPermDays',
      economicTreatmentKey: 'specialistPermSalary',
      retentionKey: 'specialistPermRetention',
    },
    annual: {
      daysAllowedKey: 'specialistAnnualDays',
      economicTreatmentKey: 'specialistAnnualSalary',
      retentionKey: 'specialistAnnualRetention',
    },
    short: {
      daysAllowedKey: 'specialistShortDays',
      economicTreatmentKey: 'specialistShortSalary',
      retentionKey: 'specialistShortRetention',
    },
  },
  personal: {
    kind: 'personal',
    titleKey: 'personalLeave',
    legalReference: 'Art. 67 co. 2 CCNL Istruzione e Ricerca 2019-2021',
    summaryKey: 'personalSummary',
    documentationKey: 'personalDocInfo',
    permanent: {
      daysAllowedKey: 'personalPermDays',
      economicTreatmentKey: 'personalPermSalary',
      retentionKey: 'personalPermRetention',
    },
    annual: {
      daysAllowedKey: 'personalAnnualDays',
      economicTreatmentKey: 'personalAnnualSalary',
      retentionKey: 'personalAnnualRetention',
    },
    short: {
      daysAllowedKey: 'personalShortDays',
      economicTreatmentKey: 'personalShortSalary',
      retentionKey: 'personalShortRetention',
    },
  },
  parental: {
    kind: 'parental',
    titleKey: 'parental',
    legalReference: 'D.Lgs. 151/2001 e Art. 34 / 67 CCNL 2019-2021',
    summaryKey: 'parentalSummary',
    documentationKey: 'parentalDocInfo',
    permanent: {
      daysAllowedKey: 'parentalPermDays',
      economicTreatmentKey: 'parentalPermSalary',
      retentionKey: 'parentalPermRetention',
    },
    annual: {
      daysAllowedKey: 'parentalAnnualDays',
      economicTreatmentKey: 'parentalAnnualSalary',
      retentionKey: 'parentalAnnualRetention',
    },
    short: {
      daysAllowedKey: 'parentalShortDays',
      economicTreatmentKey: 'parentalShortSalary',
      retentionKey: 'parentalShortRetention',
    },
  },
  law104: {
    kind: 'law104',
    titleKey: 'law104Leave',
    legalReference: 'Art. 33 L. 104/1992 e Art. 68 CCNL 2019-2021',
    summaryKey: 'law104Summary',
    documentationKey: 'law104DocInfo',
    permanent: {
      daysAllowedKey: 'law104PermDays',
      economicTreatmentKey: 'law104PermSalary',
      retentionKey: 'law104PermRetention',
    },
    annual: {
      daysAllowedKey: 'law104AnnualDays',
      economicTreatmentKey: 'law104AnnualSalary',
      retentionKey: 'law104AnnualRetention',
    },
    short: {
      daysAllowedKey: 'law104ShortDays',
      economicTreatmentKey: 'law104ShortSalary',
      retentionKey: 'law104ShortRetention',
    },
  },
  holiday: {
    kind: 'holiday',
    titleKey: 'holiday',
    legalReference: 'Art. 13 CCNL 2007 e Art. 66 CCNL 2019-2021',
    summaryKey: 'holidaySummary',
    documentationKey: 'holidayDocInfo',
    permanent: {
      daysAllowedKey: 'holidayPermDays',
      economicTreatmentKey: 'holidaySalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'holidayAnnualDays',
      economicTreatmentKey: 'holidaySalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'holidayShortDays',
      economicTreatmentKey: 'holidaySalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
  festivity: {
    kind: 'festivity',
    titleKey: 'festivity',
    legalReference: 'Legge 937/1977',
    summaryKey: 'festivitySummary',
    documentationKey: 'festivityDocInfo',
    commonAllContractsKey: 'festivityAllContracts',
    permanent: {
      daysAllowedKey: 'festivityDaysAllowed',
      economicTreatmentKey: 'festivitySalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'festivityDaysAllowed',
      economicTreatmentKey: 'festivitySalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'festivityDaysAllowed',
      economicTreatmentKey: 'festivitySalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
  bereavement: {
    kind: 'bereavement',
    titleKey: 'bereavement',
    legalReference: 'Art. 67 co. 1 CCNL 2019-2021',
    summaryKey: 'bereavementSummary',
    documentationKey: 'bereavementDocInfo',
    commonAllContractsKey: 'bereavementAllContracts',
    permanent: {
      daysAllowedKey: 'bereavementDaysAllowed',
      economicTreatmentKey: 'bereavementSalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'bereavementDaysAllowed',
      economicTreatmentKey: 'bereavementSalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'bereavementDaysAllowed',
      economicTreatmentKey: 'bereavementSalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
  blood: {
    kind: 'blood',
    titleKey: 'blood',
    legalReference: 'Legge 219/2005 e D.M. 08/04/1968',
    summaryKey: 'bloodSummary',
    documentationKey: 'bloodDocInfo',
    commonAllContractsKey: 'bloodAllContracts',
    permanent: {
      daysAllowedKey: 'bloodDaysAllowed',
      economicTreatmentKey: 'bloodSalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'bloodDaysAllowed',
      economicTreatmentKey: 'bloodSalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'bloodDaysAllowed',
      economicTreatmentKey: 'bloodSalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
  study: {
    kind: 'study',
    titleKey: 'studyLeave',
    legalReference: 'Art. 3 DPR 395/1988 e Contrattazione Integrativa Regionale (CIR)',
    summaryKey: 'studySummary',
    documentationKey: 'studyDocInfo',
    commonAllContractsKey: 'studyAllContracts',
    permanent: {
      daysAllowedKey: 'studyDaysAllowed',
      economicTreatmentKey: 'studySalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'studyDaysAllowed',
      economicTreatmentKey: 'studySalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'studyDaysAllowed',
      economicTreatmentKey: 'studySalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
  marriage: {
    kind: 'marriage',
    titleKey: 'marriageLeave',
    legalReference: 'Art. 15 co. 3 CCNL 2007 (Vigente)',
    summaryKey: 'marriageSummary',
    documentationKey: 'marriageDocInfo',
    commonAllContractsKey: 'marriageAllContracts',
    permanent: {
      daysAllowedKey: 'marriageDaysAllowed',
      economicTreatmentKey: 'marriageSalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'marriageDaysAllowed',
      economicTreatmentKey: 'marriageSalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'marriageDaysAllowed',
      economicTreatmentKey: 'marriageSalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
  other: {
    kind: 'other',
    titleKey: 'other',
    legalReference: 'Disposizioni Generali TU Pubblico Impiego',
    summaryKey: 'otherSummary',
    documentationKey: 'otherDocInfo',
    permanent: {
      daysAllowedKey: 'otherDaysAllowed',
      economicTreatmentKey: 'otherSalaryInfo',
      retentionKey: 'holidayPermRetention',
    },
    annual: {
      daysAllowedKey: 'otherDaysAllowed',
      economicTreatmentKey: 'otherSalaryInfo',
      retentionKey: 'holidayAnnualRetention',
    },
    short: {
      daysAllowedKey: 'otherDaysAllowed',
      economicTreatmentKey: 'otherSalaryInfo',
      retentionKey: 'holidayShortRetention',
    },
  },
};
