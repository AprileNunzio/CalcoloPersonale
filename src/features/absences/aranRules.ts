import type { Entry } from '../../shared/types';

export interface AranAlert {
  id: string;
  ruleCode: string;
  title: string;
  severity: 'critical_red' | 'warning_amber' | 'info_blue';
  affectedDates: string[];
  summary: string;
  legalReference: string;
  aranInterpretation: string;
  weekendAccounting: 'congedo_parentale' | 'malattia' | 'neutro' | 'da_verificare';
  consequence: string;
}

export interface WorkScheduleConfig {
  daysPerWeek: 5 | 6;
}

function parseIso(dStr: string): Date | null {
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

function isWeekend(d: Date, daysPerWeek: 5 | 6 = 5): boolean {
  const day = d.getDay(); // 0 = Dom, 6 = Sab
  if (daysPerWeek === 5) {
    return day === 0 || day === 6;
  }
  return day === 0; // su 6 giorni solo Domenica è festivo non lavorativo
}

export function analyzeAranAbsenceSequences(
  records: Entry[],
  schedule: WorkScheduleConfig = { daysPerWeek: 5 },
): AranAlert[] {
  const alerts: AranAlert[] = [];

  const absences = records
    .filter(r => ['sickness', 'parental', 'holiday', 'personal', 'specialist', 'other'].includes(r.kind))
    .map(r => ({
      entry: r,
      startDate: parseIso(r.start),
      endDate: parseIso(r.end || r.start),
    }))
    .filter((a): a is { entry: Entry; startDate: Date; endDate: Date } => a.startDate !== null && a.endDate !== null)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (absences.length === 0) return alerts;

  // 1. ARAN CIRS46 (Id: 28476): Congedo parentale -> Malattia -> Congedo parentale
  for (let i = 0; i < absences.length - 2; i++) {
    const a1 = absences[i];
    const a2 = absences[i + 1];
    const a3 = absences[i + 2];

    if (a1.entry.kind === 'parental' && a2.entry.kind === 'sickness' && a3.entry.kind === 'parental') {
      const gap1 = getDayDiff(a1.endDate, a2.startDate);
      const gap2 = getDayDiff(a2.endDate, a3.startDate);

      // Verifichiamo se tra a1 e a2 o tra a2 e a3 c'è un weekend (senza rientro lavorativo intermedio)
      const isContiguousOrWeekend1 = gap1 >= 1 && gap1 <= (schedule.daysPerWeek === 5 ? 3 : 2);
      const isContiguousOrWeekend2 = gap2 >= 1 && gap2 <= (schedule.daysPerWeek === 5 ? 3 : 2);

      if (isContiguousOrWeekend1 && isContiguousOrWeekend2) {
        // Troviamo le date di sabato e domenica coinvolte
        const affectedDates: string[] = [];
        const cur = new Date(a1.endDate);
        cur.setDate(cur.getDate() + 1);
        while (cur < a3.startDate) {
          if (isWeekend(cur, schedule.daysPerWeek)) {
            affectedDates.push(formatIso(new Date(cur)));
          }
          cur.setDate(cur.getDate() + 1);
        }

        alerts.push({
          id: `aran_cirs46_${a1.entry.id}_${a2.entry.id}_${a3.entry.id}`,
          ruleCode: 'ARAN CIRS46 (Id: 28476)',
          title: 'CONTEGGIO SABATO E DOMENICA A CARICO DEL CONGEDO PARENTALE',
          severity: 'critical_red',
          affectedDates,
          summary:
            'Due periodi di congedo parentale sono intervallati da malattia senza che si sia verificata una effettiva ripresa del servizio.',
          legalReference: 'Art. 34 CCNL Istruzione e Ricerca 2019-2021 (ex art. 12 c. 6 CCNL 2007) - ARAN CIRS46',
          aranInterpretation:
            'Secondo l’orientamento applicativo ARAN CIRS46, se la malattia si colloca in mezzo a due frazioni di congedo parentale senza che il dipendente rientri al lavoro nemmeno per un giorno, sabato e domenica vengono conteggiati come congedo parentale (salvo che il certificato di malattia copra espressamente il weekend).',
          weekendAccounting: 'congedo_parentale',
          consequence:
            'I giorni di sabato e domenica intermedi saranno detratti dal massimale dei giorni di congedo parentale spettanti e dall’eventuale retribuzione al 100%/30%!',
        });
      }
    }
  }

  // 2. Congedo parentale a ridosso del weekend senza rientro: Ven congedo -> Lun congedo (ARAN CIRS36)
  for (let i = 0; i < absences.length - 1; i++) {
    const a1 = absences[i];
    const a2 = absences[i + 1];

    if (a1.entry.kind === 'parental' && a2.entry.kind === 'parental') {
      const dayEnd = a1.endDate.getDay(); // 5 = Venerdì
      const dayNextStart = a2.startDate.getDay(); // 1 = Lunedì
      const diff = getDayDiff(a1.endDate, a2.startDate);

      if (schedule.daysPerWeek === 5 && dayEnd === 5 && dayNextStart === 1 && diff === 3) {
        const sat = new Date(a1.endDate);
        sat.setDate(sat.getDate() + 1);
        const sun = new Date(a1.endDate);
        sun.setDate(sun.getDate() + 2);

        alerts.push({
          id: `aran_cirs36_weekend_${a1.entry.id}_${a2.entry.id}`,
          ruleCode: 'ARAN CIRS36 / Art. 34 CCNL',
          title: 'SABATO E DOMENICA COMPUTATI NEL CONGEDO PARENTALE',
          severity: 'critical_red',
          affectedDates: [formatIso(sat), formatIso(sun)],
          summary:
            'Congedo parentale fruito fino al venerdì e ripreso il lunedì successivo senza ripresa del servizio lavorativo.',
          legalReference: 'Art. 34 c. 6 CCNL 2019-2021 - Orientamento ARAN CIRS36',
          aranInterpretation:
            'Le giornate di sabato e domenica che si collocano tra due periodi di congedo parentale continuativo senza rientro in servizio si computano all’interno del congedo stesso.',
          weekendAccounting: 'congedo_parentale',
          consequence:
            'Sabato e domenica (2 giorni) vengono scalati dal congedo parentale del lavoratore.',
        });
      }
    }
  }

  // 3. Malattia fino al venerdì e ripresa malattia il lunedì (Circolare DFP 8/2008 & ARAN)
  for (let i = 0; i < absences.length - 1; i++) {
    const a1 = absences[i];
    const a2 = absences[i + 1];

    if (a1.entry.kind === 'sickness' && a2.entry.kind === 'sickness') {
      const dayEnd = a1.endDate.getDay();
      const dayNextStart = a2.startDate.getDay();
      const diff = getDayDiff(a1.endDate, a2.startDate);

      if (schedule.daysPerWeek === 5 && dayEnd === 5 && dayNextStart === 1 && diff === 3) {
        const sat = new Date(a1.endDate);
        sat.setDate(sat.getDate() + 1);
        const sun = new Date(a1.endDate);
        sun.setDate(sun.getDate() + 2);

        alerts.push({
          id: `aran_sickness_weekend_${a1.entry.id}_${a2.entry.id}`,
          ruleCode: 'Circolare DFP n. 8/2008 & ARAN',
          title: 'SABATO E DOMENICA CONTEGGIATI NEL PERIODO DI MALATTIA (COMPORTO)',
          severity: 'warning_amber',
          affectedDates: [formatIso(sat), formatIso(sun)],
          summary:
            'Due certificati di malattia consecutivi tra il venerdì e il lunedì successivo senza alcuna ripresa lavorativa.',
          legalReference: 'Circolare Funzione Pubblica n. 8/2008 - Art. 67 CCNL 2019-2021',
          aranInterpretation:
            'I giorni di sabato e domenica interposti tra due periodi di malattia senza rientro in servizio vengono computati nel periodo di assenza per malattia e nel calcolo del periodo di comporto.',
          weekendAccounting: 'malattia',
          consequence:
            'Il weekend viene conteggiato nei giorni complessivi di malattia ai fini del comporto e dell’eventuale decurtazione Brunetta.',
        });
      }
    }
  }

  // 4. Sequenze neutre (Congedo -> Malattia o Malattia -> Congedo con sola transizione semplice)
  for (let i = 0; i < absences.length - 1; i++) {
    const a1 = absences[i];
    const a2 = absences[i + 1];

    const isParentalToSickness = a1.entry.kind === 'parental' && a2.entry.kind === 'sickness';
    const isSicknessToParental = a1.entry.kind === 'sickness' && a2.entry.kind === 'parental';

    if (isParentalToSickness || isSicknessToParental) {
      // Verifichiamo che non sia parte del pattern a 3 Congedo -> Malattia -> Congedo già segnalato
      const isPartOfTrio = alerts.some(
        al => al.id.includes(a1.entry.id) && al.id.includes(a2.entry.id) && al.ruleCode.includes('CIRS46')
      );

      if (!isPartOfTrio) {
        const diff = getDayDiff(a1.endDate, a2.startDate);
        if (diff === 3 && a1.endDate.getDay() === 5 && a2.startDate.getDay() === 1) {
          const sat = new Date(a1.endDate);
          sat.setDate(sat.getDate() + 1);
          const sun = new Date(a1.endDate);
          sun.setDate(sun.getDate() + 2);

          alerts.push({
            id: `aran_neutral_weekend_${a1.entry.id}_${a2.entry.id}`,
            ruleCode: 'Messaggio INPS 19772 / ARAN',
            title: 'SABATO E DOMENICA NEUTRI (GIORNI DI RIPOSO NON COMPUTABILI)',
            severity: 'info_blue',
            affectedDates: [formatIso(sat), formatIso(sun)],
            summary:
              'Assenze a titolo diverso consecutive a cavallo del fine settimana (es. congedo venerdì e malattia lunedì).',
            legalReference: 'Messaggio INPS n. 19772 - Nota RTS prot. n. 108127/1999',
            aranInterpretation:
              'I giorni non lavorativi compresi tra due assenze a titolo diverso non si sommano e non sono computabili né a titolo di malattia né come congedo.',
            weekendAccounting: 'neutro',
            consequence: 'Sabato e domenica rimangono neutri: nessun giorno viene decurtato al dipendente.',
          });
        }
      }
    }
  }

  return alerts;
}
