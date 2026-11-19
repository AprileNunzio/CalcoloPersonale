import type { Person, Entry } from '../../shared/types';
import type { TimelineData, TimelineDeadline, ActiveContractInfo, Profile24MesiStatus } from './timelineTypes';
import { getActiveProfiles } from '../../shared/scoring';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { computeFirstTierEligibility } from '../../shared/careerPrediction';

function parseIso(dStr: string | null | undefined): Date | null {
  if (!dStr) return null;
  const parts = dStr.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDayDiff(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function computeTimelineDeadlines(person: Person, todayInput?: Date): TimelineData {
  const today = todayInput || new Date();
  today.setHours(0, 0, 0, 0);

  const deadlines: TimelineDeadline[] = [];
  const records = person.records || [];
  const services = records.filter(r => r.kind === 'service');

  const isPersonRuolo = services.some(s => {
    try {
      if (s.notes?.startsWith('{')) {
        const p = JSON.parse(s.notes);
        return p.isRuolo === true || p.contractType === 'permanent';
      }
    } catch {}
    return false;
  });

  // 1. Calcolo Anzianità per 24 Mesi ATA (Art. 554 D.Lgs. 297/94)
  // Requisito normativo: 23 mesi e 16 giorni = 716 giorni di servizio effettivo statale
  let totalStataleDays = 0;
  for (const s of services) {
    let parsedNotes: Record<string, unknown> = {};
    try {
      if (s.notes?.startsWith('{')) parsedNotes = JSON.parse(s.notes);
    } catch {
      parsedNotes = {};
    }
    const sector = String(parsedNotes.sector || '');
    const isParitaria = sector === 'paritaria_ata' || s.school?.category === 'SCUANAGRAFEPA';
    const isOngoing = !s.end || parsedNotes.isRuolo === true || parsedNotes.contractType === 'permanent';

    if (!isParitaria) {
      const d1 = parseIso(s.start);
      const d2 = isOngoing ? today : parseIso(s.end);
      if (d1 && d2 && d2 >= d1) {
        totalStataleDays += getDayDiff(d1, d2) + 1;
      }
    }
  }

  const REQUIREMENT_24M_DAYS = 716;
  const is24MesiReached = isPersonRuolo || totalStataleDays >= REQUIREMENT_24M_DAYS;
  const daysTo24Mesi = Math.max(0, REQUIREMENT_24M_DAYS - totalStataleDays);
  const percent24Mesi = isPersonRuolo ? 100 : Math.min(100, Math.round((totalStataleDays / REQUIREMENT_24M_DAYS) * 100));

  let dateTarget24M = '';
  if (is24MesiReached) {
    dateTarget24M = formatIso(today);
  } else {
    const estDate = new Date(today);
    estDate.setDate(estDate.getDate() + daysTo24Mesi);
    dateTarget24M = formatIso(estDate);
  }

  deadlines.push({
    id: 'deadline_24mesi_ata',
    type: 'graduatorie24m',
    title: isPersonRuolo
      ? 'Personale di Ruolo (Tempo Indeterminato Confermato)'
      : is24MesiReached
      ? 'Requisito 24 Mesi ATA Conquistato! (1ª Fascia)'
      : 'Traguardo 24 Mesi ATA (Graduatorie Permanenti)',
    targetDate: dateTarget24M,
    daysRemaining: isPersonRuolo ? 0 : daysTo24Mesi,
    status: is24MesiReached ? 'completed' : 'active_countdown',
    badge: isPersonRuolo ? '✓ RUOLO A TEMPO INDETERMINATO' : is24MesiReached ? '✓ REQUISITO MATURATO' : `${daysTo24Mesi} gg mancanti`,
    description: isPersonRuolo
      ? `Inquadrato a tempo indeterminato con ${totalStataleDays} giorni di servizio statale registrati. Pieno diritto di titolarità contrattuale ATA.`
      : is24MesiReached
      ? `Hai maturato ${totalStataleDays} giorni di servizio statale (superati i 716 giorni previsti dall'art. 554 D.Lgs. 297/94). Hai pieno diritto all'inserimento nelle graduatorie permanenti ATA 24 Mesi.`
      : `Hai accumulato finora ${totalStataleDays} di 716 giorni di servizio statale necessari (23 mesi e 16 giorni). Mancano ${daysTo24Mesi} giorni di servizio.`,
    actionNote: isPersonRuolo
      ? 'Posizione contrattuale consolidata a tempo indeterminato.'
      : is24MesiReached
      ? 'Monitora la finestra annuale di apertura del bando ATA 24 Mesi su Istanze Online (aprile/maggio) per presentare domanda di primo inserimento.'
      : 'Continua a registrare i contratti statali per monitorare l’avvicinamento al compimento del requisito.',
    progressPercent: percent24Mesi,
    urgency: is24MesiReached ? 'good_green' : percent24Mesi >= 75 ? 'warning_amber' : 'neutral',
    legalReference: 'Art. 554 D.Lgs. 297/1994 - O.M. Graduatorie Permanenti ATA',
  });

  // 2. Calcolo Contratto Attivo & Countdown NASpI (68 Giorni ex D.Lgs. 22/2015)
  let activeContract: ActiveContractInfo | null = null;
  let latestEndedService: { entry: Entry; end: Date } | null = null;

  for (const s of services) {
    let parsedNotes: Record<string, unknown> = {};
    try {
      if (s.notes?.startsWith('{')) parsedNotes = JSON.parse(s.notes);
    } catch {}
    const isRuoloRec = parsedNotes.isRuolo === true || parsedNotes.contractType === 'permanent';
    const isOngoing = !s.end || isRuoloRec;
    const dStart = parseIso(s.start);
    if (!dStart) continue;

    if (isOngoing) {
      const totalDur = getDayDiff(dStart, today) + 1;
      activeContract = {
        schoolName: s.school?.name || s.title || 'Istituzione Scolastica',
        profile: s.profile || 'CS',
        startDate: s.start,
        endDate: s.end || 'In corso',
        daysRemaining: isRuoloRec ? 0 : 9999,
        totalDurationDays: totalDur,
        progressPercent: 100,
      };
    } else {
      const dEnd = parseIso(s.end);
      if (dEnd) {
        if (dStart <= today && today <= dEnd) {
          const daysLeft = getDayDiff(today, dEnd);
          const totalDur = getDayDiff(dStart, dEnd) + 1;
          const progress = Math.min(100, Math.round(((totalDur - daysLeft) / totalDur) * 100));

          activeContract = {
            schoolName: s.school?.name || s.title || 'Istituzione Scolastica',
            profile: s.profile || 'CS',
            startDate: s.start,
            endDate: s.end || formatIso(today),
            daysRemaining: daysLeft,
            totalDurationDays: totalDur,
            progressPercent: progress,
          };
        } else if (dEnd < today && !isPersonRuolo) {
          if (!latestEndedService || dEnd > latestEndedService.end) {
            latestEndedService = { entry: s, end: dEnd };
          }
        }
      }
    }
  }

  if (activeContract) {
    if (isPersonRuolo) {
      deadlines.push({
        id: 'deadline_active_contract',
        type: 'contract_end',
        title: `Contratto a Tempo Indeterminato (${activeContract.profile})`,
        targetDate: formatIso(today),
        daysRemaining: activeContract.totalDurationDays,
        status: 'completed',
        badge: 'DI RUOLO',
        description: `Titolare di ruolo presso ${activeContract.schoolName} dal ${activeContract.startDate} (${activeContract.totalDurationDays} giorni di servizio maturati).`,
        actionNote: 'Contratto a tempo indeterminato attivo.',
        progressPercent: 100,
        urgency: 'good_green',
        legalReference: 'CCNL Comparto Istruzione e Ricerca',
      });
    } else {
      deadlines.push({
        id: 'deadline_active_contract',
        type: 'contract_end',
        title: `Scadenza Contratto di Lavoro (${activeContract.profile})`,
        targetDate: activeContract.endDate,
        daysRemaining: activeContract.daysRemaining,
        status: 'active_countdown',
        badge: `${activeContract.daysRemaining} gg al termine`,
        description: `Contratto in corso presso ${activeContract.schoolName}. Termine previsto per il ${activeContract.endDate}.`,
        actionNote: 'Alla scadenza del contratto, in caso di mancata proroga, avrai diritto alla disoccupazione NASpI.',
        progressPercent: activeContract.progressPercent,
        urgency: activeContract.daysRemaining <= 15 ? 'warning_amber' : 'neutral',
        legalReference: 'Contratto Individuale di Lavoro CCNL Istruzione',
      });
    }
  }

  // Countdown NASpI (solo per contratti a termine terminati, mai per dipendenti di ruolo)
  let naspiDaysRemaining: number | null = null;
  let naspiWindowOpen = false;
  let lastContractEndDate: string | null = null;

  if (latestEndedService && !activeContract && !isPersonRuolo) {
    lastContractEndDate = formatIso(latestEndedService.end);
    const daysSinceEnd = getDayDiff(latestEndedService.end, today);
    naspiDaysRemaining = 68 - daysSinceEnd;
    naspiWindowOpen = naspiDaysRemaining > 0;

    const deadlineDate = new Date(latestEndedService.end);
    deadlineDate.setDate(deadlineDate.getDate() + 68);

    if (naspiDaysRemaining > 0) {
      const isUrgent = naspiDaysRemaining <= 10;
      const isWithin8Days = daysSinceEnd <= 8;

      deadlines.push({
        id: 'deadline_naspi_window',
        type: 'naspi',
        title: 'Termine Decadenza Domanda NASpI INPS (68 Giorni)',
        targetDate: formatIso(deadlineDate),
        daysRemaining: naspiDaysRemaining,
        status: 'active_countdown',
        badge: `${naspiDaysRemaining} gg rimasti`,
        description: `Il tuo ultimo contratto si è concluso il ${lastContractEndDate} (${daysSinceEnd} giorni fa). Mancano ${naspiDaysRemaining} giorni prima della decadenza definitiva del diritto alla NASpI.`,
        actionNote: isWithin8Days
          ? '⚡ Sei ancora nei primi 8 giorni: se presenti domanda ora, l’indennità decorrerà fin dall’ottavo giorno successivo alla cessazione!'
          : 'Se presenti domanda ora, l’indennità NASpI decorrerà a partire dal giorno successivo alla data di invio telematico sul sito INPS.',
        progressPercent: Math.min(100, Math.round(((68 - naspiDaysRemaining) / 68) * 100)),
        urgency: isUrgent ? 'critical_red' : naspiDaysRemaining <= 25 ? 'warning_amber' : 'good_green',
        legalReference: 'Art. 6 D.Lgs. 22/2015 (Termine di decadenza perentorio di 68 giorni)',
      });
    } else {
      deadlines.push({
        id: 'deadline_naspi_expired',
        type: 'naspi',
        title: 'Termine Decadenza NASpI Trascorsco',
        targetDate: formatIso(deadlineDate),
        daysRemaining: 0,
        status: 'expired',
        badge: 'SCADUTO',
        description: `Sono trascorsi oltre 68 giorni dalla cessazione del contratto del ${lastContractEndDate}. Il termine legale perentorio è decaduto.`,
        actionNote: 'Il diritto all’indennità di disoccupazione per questo contratto non può più essere fatto valere all’INPS.',
        progressPercent: 100,
        urgency: 'critical_red',
        legalReference: 'Art. 6 D.Lgs. 22/2015',
      });
    }
  } else if (activeContract && !isPersonRuolo) {
    // Proiezione NASpI per contratto in corso
    const contractEnd = parseIso(activeContract.endDate);
    if (contractEnd) {
      const projectedNaspiEnd = new Date(contractEnd);
      projectedNaspiEnd.setDate(projectedNaspiEnd.getDate() + 68);

      deadlines.push({
        id: 'deadline_naspi_projected',
        type: 'naspi',
        title: 'Finestra NASpI Futura (Alla Scadenza del Contratto)',
        targetDate: formatIso(projectedNaspiEnd),
        daysRemaining: activeContract.daysRemaining + 68,
        status: 'upcoming',
        badge: 'Proiezione dopo contratto',
        description: `Al termine del contratto in corso (${activeContract.endDate}), avrai 68 giorni per presentare domanda di indennità NASpI all'INPS (fino al ${formatIso(projectedNaspiEnd)}).`,
        actionNote: 'Presenta domanda entro i primi 8 giorni dalla scadenza per ottenere la decorrenza immediata.',
        urgency: 'neutral',
        legalReference: 'Art. 6 D.Lgs. 22/2015',
      });
    }
  }

  // 3. Monitoraggio Comporto Malattia ATA
  const sicknessAbsences = records.filter(r => r.kind === 'sickness');
  let totalSicknessDays = 0;
  for (const s of sicknessAbsences) {
    const d1 = parseIso(s.start);
    const d2 = parseIso(s.end || s.start);
    if (d1 && d2 && d2 >= d1) totalSicknessDays += getDayDiff(d1, d2) + 1;
  }

  const isRuolo = Boolean(person.profile && person.profile !== '—');
  const maxComporto = isRuolo ? 540 : 270;
  const daysToComporto = Math.max(0, maxComporto - totalSicknessDays);

  if (totalSicknessDays > 0) {
    deadlines.push({
      id: 'deadline_comporto_sickness',
      type: 'comporto_sickness',
      title: 'Residuo Periodo di Comporto Malattia',
      targetDate: formatIso(today),
      daysRemaining: daysToComporto,
      status: daysToComporto === 0 ? 'expired' : 'active_countdown',
      badge: `${daysToComporto} gg residui`,
      description: `Hai fruito di ${totalSicknessDays} giorni di malattia nel triennio su un massimale di ${maxComporto} giorni previsti dal CCNL.`,
      actionNote: isRuolo
        ? 'Primi 9 mesi retribuiti al 100%, 3 mesi al 90%, 6 mesi al 50%.'
        : 'Per supplenze annuali il comporto è di 9 mesi (1° mese 100%, 2°-3° mese 50%). Per supplenze brevi: max 30 gg/anno al 50%.',
      progressPercent: Math.min(100, Math.round((totalSicknessDays / maxComporto) * 100)),
      urgency: daysToComporto < 30 ? 'critical_red' : daysToComporto < 90 ? 'warning_amber' : 'good_green',
      legalReference: 'Art. 17 e 19 CCNL Comparto Istruzione e Ricerca',
    });
  }

  const activeProfiles = getActiveProfiles(person);
  const profile24MesiList: Profile24MesiStatus[] = activeProfiles.map(code => {
    const ft = computeFirstTierEligibility(person, code);
    return {
      profileCode: code,
      profileLabel: PROFILE_LABELS[code] || code,
      specificDays: ft.specificDays,
      otherAtaDays: ft.otherAtaDays,
      docenteDays: ft.docenteDays,
      totalValidDays: ft.totalDays,
      targetDays: ft.targetDays,
      percent: ft.percentCompleted,
      isReached: isPersonRuolo || ft.isEligible,
      daysRemaining: isPersonRuolo ? 0 : ft.remainingDays,
      projectedWindow: ft.projectedWindow,
    };
  });

  return {
    deadlines,
    totalStataleDays,
    daysTo24Mesi,
    is24MesiReached,
    percent24Mesi,
    profile24MesiList,
    naspiDaysRemaining: isPersonRuolo ? null : naspiDaysRemaining,
    naspiWindowOpen: isPersonRuolo ? false : naspiWindowOpen,
    isPersonRuolo,
    activeContract,
    lastContractEndDate,
  };
}
