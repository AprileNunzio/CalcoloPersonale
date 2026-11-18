import { Person, Entry } from '../../shared/types';
import { parseDays } from '../../shared/scoring';

export interface NaspiPaymentRecord {
  id: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number; // Importo netto bonifico
  competenceMonth: string; // es. "2024-07"
  daysPaid?: number; // Giorni retribuiti nel mese
  notes?: string;
}

export interface NaspiMonthProjection {
  monthIndex: number; // 1, 2, ...
  monthLabel: string;
  grossAmount: number;
  estimatedNetAmount: number;
  isDecalageActive: boolean;
  decalageRatePercent: number;
}

export interface NaspiEvaluation {
  isEligible: boolean;
  isPermanentStaff: boolean;
  terminationDate: string;
  daysWorkedLast4Years: number;
  weeksWorkedLast4Years: number;
  durationWeeks: number;
  durationMonths: number;
  averageMonthlyGross: number;
  baseMonthlyGross: number;
  baseMonthlyNet: number;
  maxMonthlyCap: number;
  ageOver55: boolean;
  decalageStartMonth: number;
  deadlineDateStr: string; // 68 giorni
  daysLeftToApply: number;
  decorrenzaDateStr: string; // 8 giorni
  monthlyProjections: NaspiMonthProjection[];
  totalProjectedGross: number;
  totalProjectedNet: number;
}

export interface PaymentVerificationResult {
  payment: NaspiPaymentRecord;
  expectedNet: number;
  difference: number;
  differencePercent: number;
  status: 'conforme' | 'parziale' | 'anomalia';
  statusLabel: string;
  explanation: string;
}

const SOGLIA_BASE_2024 = 1425.21;
const MASSIMALE_NASPI_2024 = 1550.42;

function parseServiceNotes(notes: string): Record<string, unknown> {
  try {
    if (notes && notes.startsWith('{')) return JSON.parse(notes);
  } catch {
    return {};
  }
  return {};
}

const PROFILE_BASE_WAGES: Record<string, number> = {
  CS: 1447.00,
  OS: 1501.15,
  AA: 1581.60,
  AT: 1581.60,
  CU: 1581.60,
  GU: 1501.15,
  CR: 1447.00,
  DOCENTE: 1865.70,
};

export function evaluateNaspiForPerson(person: Person, customWeeklyHours?: number): NaspiEvaluation {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');

  // Ordina i servizi dal più recente al più vecchio
  const sortedServices = [...services].sort((a, b) => {
    const endA = a.end || a.start;
    const endB = b.end || b.start;
    return endB.localeCompare(endA);
  });

  const latestService = sortedServices[0];
  const latestNotes = latestService ? parseServiceNotes(latestService.notes) : {};
  const isPermanentStaff = latestNotes.isRuolo === true || latestNotes.contractType === 'permanent';

  // Calcola data cessazione
  const terminationDate = latestService?.end || '2024-06-30';
  const termDateObj = new Date(terminationDate);

  // Calcolo età persona (over 55 ha décalage dall'8° mese anziché dal 6°)
  let ageOver55 = false;
  if (person.birthDate) {
    const bDate = new Date(person.birthDate);
    const ageDiff = (termDateObj.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    ageOver55 = ageDiff >= 55;
  }

  // Calcola giorni e settimane lavorate negli ultimi 4 anni prima della cessazione
  const fourYearsPrior = new Date(termDateObj.getTime() - 4 * 365.25 * 24 * 60 * 60 * 1000);
  let daysWorkedLast4Years = 0;

  for (const s of services) {
    const sStart = new Date(s.start);
    const sEnd = s.end ? new Date(s.end) : sStart;
    if (sEnd >= fourYearsPrior && sStart <= termDateObj) {
      daysWorkedLast4Years += parseDays(s.start, s.end);
    }
  }

  // Massimo 208 settimane in 4 anni (52 * 4)
  const weeksWorkedLast4Years = Math.min(208, Math.round(daysWorkedLast4Years / 7));
  const isEligible = !isPermanentStaff && weeksWorkedLast4Years >= 13;

  // Durata NASpI: pari alla metà delle settimane di contribuzione degli ultimi 4 anni (max 104 sett = 24 mesi)
  const durationWeeks = Math.floor(weeksWorkedLast4Years / 2);
  const durationMonths = Number((durationWeeks / 4.33).toFixed(1));

  // Stima retribuzione mensile lorda in base al profilo ATA e orario settimanale
  const profile = latestService?.profile || person.profile || 'CS';
  const baseProfileGross = PROFILE_BASE_WAGES[profile] || PROFILE_BASE_WAGES.CS;
  const weeklyHours = customWeeklyHours || (typeof latestNotes.weeklyHours === 'number' ? latestNotes.weeklyHours : (profile === 'DOCENTE' ? 18 : 36));
  const fullHours = profile === 'DOCENTE' ? 18 : 36;
  const hourRatio = Math.min(1, Math.max(0.1, weeklyHours / fullHours));
  const averageMonthlyGross = Math.round(baseProfileGross * hourRatio * 100) / 100;

  // Calcolo importo base lordo mensile NASpI ex D.Lgs. 22/2015
  let baseMonthlyGross = 0;
  if (averageMonthlyGross <= SOGLIA_BASE_2024) {
    baseMonthlyGross = averageMonthlyGross * 0.75;
  } else {
    baseMonthlyGross = (SOGLIA_BASE_2024 * 0.75) + ((averageMonthlyGross - SOGLIA_BASE_2024) * 0.25);
  }
  baseMonthlyGross = Math.min(baseMonthlyGross, MASSIMALE_NASPI_2024);
  baseMonthlyGross = Math.round(baseMonthlyGross * 100) / 100;

  // Netto stimato iniziale (IRPEF ordinaria ~18% al netto delle detrazioni lavoro dipendente INPS)
  const baseMonthlyNet = Math.round(baseMonthlyGross * 0.82 * 100) / 100;

  // Décalage: decurtazione 3% al mese a partire dal 6° o 8° mese
  const decalageStartMonth = ageOver55 ? 8 : 6;
  const totalMonths = Math.max(1, Math.ceil(durationMonths));
  const monthlyProjections: NaspiMonthProjection[] = [];

  let currentGross = baseMonthlyGross;
  let totalProjectedGross = 0;
  let totalProjectedNet = 0;

  for (let m = 1; m <= Math.min(totalMonths, 24); m++) {
    const isDecalageActive = m >= decalageStartMonth;
    if (isDecalageActive) {
      currentGross = currentGross * 0.97;
    }
    const netEst = currentGross * 0.82;
    totalProjectedGross += currentGross;
    totalProjectedNet += netEst;

    monthlyProjections.push({
      monthIndex: m,
      monthLabel: `Mese ${m}`,
      grossAmount: Math.round(currentGross * 100) / 100,
      estimatedNetAmount: Math.round(netEst * 100) / 100,
      isDecalageActive,
      decalageRatePercent: isDecalageActive ? (m - decalageStartMonth + 1) * 3 : 0,
    });
  }

  // Date scadenze
  const deadlineDate = new Date(termDateObj.getTime() + 68 * 24 * 60 * 60 * 1000);
  const decorrenzaDate = new Date(termDateObj.getTime() + 8 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysLeftToApply = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    isEligible,
    isPermanentStaff,
    terminationDate,
    daysWorkedLast4Years,
    weeksWorkedLast4Years,
    durationWeeks,
    durationMonths,
    averageMonthlyGross,
    baseMonthlyGross,
    baseMonthlyNet,
    maxMonthlyCap: MASSIMALE_NASPI_2024,
    ageOver55,
    decalageStartMonth,
    deadlineDateStr: deadlineDate.toLocaleDateString('it-IT'),
    daysLeftToApply,
    decorrenzaDateStr: decorrenzaDate.toLocaleDateString('it-IT'),
    monthlyProjections,
    totalProjectedGross: Math.round(totalProjectedGross * 100) / 100,
    totalProjectedNet: Math.round(totalProjectedNet * 100) / 100,
  };
}

export function verifyPaymentCorrectness(
  payment: NaspiPaymentRecord,
  evaluation: NaspiEvaluation,
  allPayments: NaspiPaymentRecord[] = [],
): PaymentVerificationResult {
  // Trova l'indice del mese corrispondente nella sequenza dei pagamenti
  const sortedPayments = [...allPayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const paymentIdx = Math.max(0, sortedPayments.findIndex(p => p.id === payment.id));
  const projection = evaluation.monthlyProjections[paymentIdx] || evaluation.monthlyProjections[0];
  const expectedNet = projection?.estimatedNetAmount || evaluation.baseMonthlyNet;

  const diff = payment.amount - expectedNet;
  const diffPercent = expectedNet > 0 ? (diff / expectedNet) * 100 : 0;

  // Se l'importo è entro il 6% di scostamento, è conforme
  if (Math.abs(diffPercent) <= 6) {
    return {
      payment,
      expectedNet,
      difference: Math.round(diff * 100) / 100,
      differencePercent: Math.round(diffPercent * 10) / 10,
      status: 'conforme',
      statusLabel: 'Importo Conforme',
      explanation: 'Il bonifico ricevuto è perfettamente in linea con la stima algoritmica INPS.',
    };
  }

  // Se l'importo è inferiore di oltre il 20% e siamo al primo mese o sono stati pagati meno di 30 giorni:
  if (diff < 0 && (paymentIdx === 0 || (payment.daysPaid && payment.daysPaid < 28))) {
    return {
      payment,
      expectedNet,
      difference: Math.round(diff * 100) / 100,
      differencePercent: Math.round(diffPercent * 10) / 10,
      status: 'parziale',
      statusLabel: 'Accredito per Frazione di Mese',
      explanation: `L’importo è ridotto perché calcolato su frazione di mese (decorrenza dall'8° giorno o ${payment.daysPaid || 'rateo'} giorni effettivi).`,
    };
  }

  // Altrimenti anomalia o trattenute anomale
  return {
    payment,
    expectedNet,
    difference: Math.round(diff * 100) / 100,
    differencePercent: Math.round(diffPercent * 10) / 10,
    status: 'anomalia',
    statusLabel: diff < 0 ? 'Discrepanza / Trattenute Elevate' : 'Importo Superiore alla Stima',
    explanation: diff < 0
      ? `Ricevuti € ${Math.abs(diff).toFixed(2)} in meno rispetto alla stima teorica. Verificare sul prospetto INPS addizionali locali o trattenute per altre prestazioni.`
      : `Ricevuti € ${diff.toFixed(2)} in più rispetto alla stima (possibile conguaglio o rimborso fiscale).`,
  };
}

export function computeCalibratedNetRatio(
  payments: NaspiPaymentRecord[],
  baseGross: number,
): number {
  if (!payments || payments.length === 0 || baseGross <= 0) return 0.82;
  const fullPayments = payments.filter(p => !p.daysPaid || p.daysPaid >= 28);
  if (fullPayments.length === 0) return 0.82;
  const totalReceived = fullPayments.reduce((acc, p) => acc + p.amount, 0);
  const avgReceived = totalReceived / fullPayments.length;
  const calibratedRatio = avgReceived / baseGross;
  return Math.min(0.95, Math.max(0.65, Math.round(calibratedRatio * 1000) / 1000));
}
