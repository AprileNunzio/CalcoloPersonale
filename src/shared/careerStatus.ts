import { Person, Entry } from './types';
import { calculateDaysBetween } from '../features/records/serviceCalculations';

export type CareerStatusCode = 'ruolo' | 'prima_fascia' | 'terza_fascia';

export interface CareerStatus {
  code: CareerStatusCode;
  label: string;
  badgeTitle: string;
  shortDescription: string;
  isRuolo: boolean;
  isPrimaFascia: boolean;
  totalStateAtaDays: number;
  totalStateAtaMonths: number;
  daysMissingFor24Months: number;
  percentTo24Months: number;
  activeRuoloDetails?: {
    ruoloDate?: string;
    ruoloAmbito?: string;
    ruoloMobility?: string;
    titolaritaSchoolName?: string;
    serviceSchoolName?: string;
    continuityYears?: number;
    superamentoAnnoProva?: boolean;
  };
}

export const ATA_24_MONTHS_DAYS = 706; // 23 mesi e 16 giorni ex art. 554 D.Lgs. 297/94

function parseServiceNotes(notes: string): Record<string, unknown> {
  try {
    if (notes && notes.startsWith('{')) return JSON.parse(notes);
  } catch {
    return {};
  }
  return {};
}

export function computeCareerStatus(person: Person): CareerStatus {
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');

  let hasRuolo = false;
  let activeRuoloRecord: Entry | null = null;
  let totalStateAtaDays = 0;

  for (const s of services) {
    const payload = parseServiceNotes(s.notes);
    const contractType = payload.contractType as string | undefined;
    const isRuoloFlag = payload.isRuolo === true || contractType === 'permanent';
    const sector = (payload.sector as string | undefined) || 'statale_ata';

    if (isRuoloFlag) {
      hasRuolo = true;
      if (!activeRuoloRecord) {
        activeRuoloRecord = s;
      }
    }

    if (sector === 'statale_ata') {
      const days = calculateDaysBetween(s.start, s.end);
      totalStateAtaDays += days;
    }
  }

  const totalStateAtaMonths = Number((totalStateAtaDays / 30).toFixed(1));
  const isPrimaFascia = !hasRuolo && totalStateAtaDays >= ATA_24_MONTHS_DAYS;
  const daysMissingFor24Months = Math.max(0, ATA_24_MONTHS_DAYS - totalStateAtaDays);
  const percentTo24Months = Math.min(100, Math.round((totalStateAtaDays / ATA_24_MONTHS_DAYS) * 100));

  if (hasRuolo) {
    const payload = activeRuoloRecord ? parseServiceNotes(activeRuoloRecord.notes) : {};
    const titolaritaSchool = payload.titolaritaSchool as { name?: string } | undefined;
    return {
      code: 'ruolo',
      label: 'Personale di Ruolo (Tempo Indeterminato)',
      badgeTitle: 'Di Ruolo · Tempo Indeterminato',
      shortDescription: 'Titolare di cattedra/posto ATA, soggetto a regole di mobilità, continuità e assegnazione provvisoria.',
      isRuolo: true,
      isPrimaFascia: false,
      totalStateAtaDays,
      totalStateAtaMonths,
      daysMissingFor24Months: 0,
      percentTo24Months: 100,
      activeRuoloDetails: {
        ruoloDate: (payload.ruoloDate as string) || activeRuoloRecord?.start,
        ruoloAmbito: payload.ruoloAmbito as string | undefined,
        ruoloMobility: payload.ruoloMobility as string | undefined,
        titolaritaSchoolName: titolaritaSchool?.name || activeRuoloRecord?.school?.name || activeRuoloRecord?.title,
        serviceSchoolName: activeRuoloRecord?.school?.name || activeRuoloRecord?.title,
        continuityYears: typeof payload.continuityYears === 'number' ? payload.continuityYears : 0,
        superamentoAnnoProva: payload.superamentoAnnoProva === true,
      },
    };
  }

  if (isPrimaFascia) {
    return {
      code: 'prima_fascia',
      label: 'Avente Diritto 1ª Fascia ATA (24 Mesi)',
      badgeTitle: '1ª Fascia ATA (24 Mesi) · Permanente',
      shortDescription: 'Requisiti di servizio statale maturati (≥ 24 mesi). Accesso alle graduatorie permanenti provinciali art. 554.',
      isRuolo: false,
      isPrimaFascia: true,
      totalStateAtaDays,
      totalStateAtaMonths,
      daysMissingFor24Months: 0,
      percentTo24Months: 100,
    };
  }

  return {
    code: 'terza_fascia',
    label: 'Graduatorie d’Istituto 3ª Fascia ATA',
    badgeTitle: '3ª Fascia ATA · Graduatorie d’Istituto',
    shortDescription: `Maturati ${totalStateAtaMonths} mesi (${totalStateAtaDays} gg statali). Mancano ${daysMissingFor24Months} giorni per accedere alla 1ª Fascia (24 Mesi).`,
    isRuolo: false,
    isPrimaFascia: false,
    totalStateAtaDays,
    totalStateAtaMonths,
    daysMissingFor24Months,
    percentTo24Months,
  };
}
