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
  weekendAccounting: 'congedo_parentale' | 'malattia' | 'neutro' | 'da_verificare' | 'proroga_contrattuale';
  consequence: string;
  secretariatNote?: string;
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
  const day = d.getDay();
  if (daysPerWeek === 5) {
    return day === 0 || day === 6;
  }
  return day === 0;
}

export function analyzeAranAbsenceSequences(
  records: Entry[],
  schedule: WorkScheduleConfig = { daysPerWeek: 5 },
): AranAlert[] {
  const alerts: AranAlert[] = [];

  const services = records.filter(r => r.kind === 'service');
  const absences = records
    .filter(r => ['sickness', 'parental', 'holiday', 'personal', 'specialist', 'other', 'law104', 'study', 'blood'].includes(r.kind))
    .map(r => ({
      entry: r,
      startDate: parseIso(r.start),
      endDate: parseIso(r.end || r.start),
    }))
    .filter((a): a is { entry: Entry; startDate: Date; endDate: Date } => a.startDate !== null && a.endDate !== null)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (absences.length === 0) return alerts;

  // Controllo 0: Assenza collocata al di fuori di qualsiasi contratto di servizio attivo
  if (services.length > 0) {
    for (const abs of absences) {
      const isCoveredByService = services.some(s => {
        const sStart = parseIso(s.start);
        const sEnd = parseIso(s.end || '9999-12-31');
        if (!sStart || !sEnd) return false;
        return abs.startDate >= sStart && abs.endDate <= sEnd;
      });

      if (!isCoveredByService) {
        alerts.push({
          id: `aran_outside_service_${abs.entry.id}`,
          ruleCode: 'CCNL Comparto Istruzione - Titolarità Giuridica',
          title: 'ASSENZA INSERITA FUORI DA UN CONTRATTO DI SERVIZIO ATTIVO',
          severity: 'critical_red',
          affectedDates: [formatIso(abs.startDate), formatIso(abs.endDate)],
          summary: `L'assenza registrata (${abs.entry.title || abs.entry.kind}) ricade in un intervallo non coperto da alcun contratto di lavoro o nomina.`,
          legalReference: 'Art. 44 e 67 CCNL 2019-2021',
          aranInterpretation:
            'Il dipendente della scuola può giustificare assenze e richiedere permessi o congedi esclusivamente durante la vigenza di un rapporto di lavoro attivo.',
          weekendAccounting: 'da_verificare',
          consequence: 'La segreteria non potrà accettare o protocollare l’istanza in assenza di un contratto registrato a SIDI per quel periodo.',
          secretariatNote:
            'Verificare la correttezza delle date contrattuali a SIDI o la data di inizio del contratto di servizio prima di trasmettere l’assenza.',
        });
      }
    }
  }

  // Controllo 0bis: Sovrapposizione temporale tra assenze diverse
  for (let i = 0; i < absences.length - 1; i++) {
    for (let j = i + 1; j < absences.length; j++) {
      const a1 = absences[i];
      const a2 = absences[j];
      if (a1.startDate <= a2.endDate && a2.startDate <= a1.endDate) {
        alerts.push({
          id: `aran_overlap_${a1.entry.id}_${a2.entry.id}`,
          ruleCode: 'Divieto di Sovrapposizione Istituti Contrattuali',
          title: 'SOVRAPPOSIZIONE TEMPORALE TRA ASSENZE DIVERSE',
          severity: 'critical_red',
          affectedDates: [formatIso(a1.startDate), formatIso(a2.endDate)],
          summary: `Rilevata sovrapposizione tra "${a1.entry.title || a1.entry.kind}" e "${a2.entry.title || a2.entry.kind}".`,
          legalReference: 'ARAN Orientamento CFL146 - Art. 34 e 67 CCNL',
          aranInterpretation:
            'Non è consentito fruire contemporaneamente di due diversi istituti di assenza (es. malattia e ferie o congedo) nelle medesime giornate.',
          weekendAccounting: 'da_verificare',
          consequence: 'Blocco dell’inserimento a SIDI per conflitto di giustificativi.',
          secretariatNote:
            'Segnalare alla segreteria l’annullamento o la rettifica del periodo sovrapposto per evitare rilievi da parte della Ragioneria Territoriale dello Stato (RTS).',
        });
      }
    }
  }

  // 1. ARAN CIRS46 (Id: 28476): Congedo parentale -> Malattia -> Congedo parentale (senza rientro)
  for (let i = 0; i < absences.length - 2; i++) {
    const a1 = absences[i];
    const a2 = absences[i + 1];
    const a3 = absences[i + 2];

    if (a1.entry.kind === 'parental' && a2.entry.kind === 'sickness' && a3.entry.kind === 'parental') {
      const gap1 = getDayDiff(a1.endDate, a2.startDate);
      const gap2 = getDayDiff(a2.endDate, a3.startDate);

      const isContiguousOrWeekend1 = gap1 >= 1 && gap1 <= (schedule.daysPerWeek === 5 ? 3 : 2);
      const isContiguousOrWeekend2 = gap2 >= 1 && gap2 <= (schedule.daysPerWeek === 5 ? 3 : 2);

      if (isContiguousOrWeekend1 && isContiguousOrWeekend2) {
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
          title: 'SABATO E DOMENICA COMPUTATI COME CONGEDO PARENTALE A TUO SFAVORE',
          severity: 'critical_red',
          affectedDates,
          summary:
            'Due periodi di congedo parentale sono intervallati da malattia senza che si sia verificata una effettiva ripresa del servizio lavorativo.',
          legalReference: 'Art. 34 CCNL Istruzione e Ricerca 2019-2021 (ex art. 12 c. 6 CCNL 2007) - ARAN CIRS46',
          aranInterpretation:
            'Secondo l’orientamento applicativo ARAN CIRS46 (Id: 28476), se la malattia si colloca in mezzo a due frazioni di congedo parentale senza che il dipendente rientri al lavoro nemmeno per un giorno, sabato e domenica vengono conteggiati come congedo parentale. ECCEZIONE: se il certificato medico di malattia copre espressamente anche il sabato e la domenica, quei giorni rientrano nel periodo di malattia e non vengono scalati dal congedo parentale.',
          weekendAccounting: 'congedo_parentale',
          consequence:
            'I giorni di sabato e domenica intermedi saranno detratti dal massimale dei giorni di congedo parentale spettanti e dall’eventuale retribuzione al 100%/30%!',
          secretariatNote:
            'Nota per la Segreteria Scolastica: "Si fa presente che ai sensi dell’orientamento ARAN CIRS46, qualora il certificato di malattia del dipendente copra espressamente il fine settimana, le giornate di sabato e domenica devono essere imputate a malattia e non scalate dal congedo parentale. Si richiede la verifica della prognosi telematica prima della trasmissione al SIDI."',
        });
      }
    }
  }

  // 2. Congedo parentale a ridosso del weekend senza rientro: Ven congedo -> Lun congedo (ARAN CIRS36)
  for (let i = 0; i < absences.length - 1; i++) {
    const a1 = absences[i];
    const a2 = absences[i + 1];

    if (a1.entry.kind === 'parental' && a2.entry.kind === 'parental') {
      const dayEnd = a1.endDate.getDay();
      const dayNextStart = a2.startDate.getDay();
      const diff = getDayDiff(a1.endDate, a2.startDate);

      if (schedule.daysPerWeek === 5 && dayEnd === 5 && dayNextStart === 1 && diff === 3) {
        const sat = new Date(a1.endDate);
        sat.setDate(sat.getDate() + 1);
        const sun = new Date(a1.endDate);
        sun.setDate(sun.getDate() + 2);

        alerts.push({
          id: `aran_cirs36_weekend_${a1.entry.id}_${a2.entry.id}`,
          ruleCode: 'ARAN CIRS36 / Art. 34 CCNL',
          title: 'SABATO E DOMENICA CONTEGGIATI NEL CONGEDO PARENTALE',
          severity: 'critical_red',
          affectedDates: [formatIso(sat), formatIso(sun)],
          summary:
            'Congedo parentale fruito fino al venerdì e ripreso il lunedì successivo senza ripresa del servizio lavorativo.',
          legalReference: 'Art. 34 c. 6 CCNL 2019-2021 - Orientamento ARAN CIRS36',
          aranInterpretation:
            'Le giornate di sabato e domenica che si collocano tra due periodi di congedo parentale continuativo senza rientro in servizio si computano all’interno del congedo stesso.',
          weekendAccounting: 'congedo_parentale',
          consequence: 'Sabato e domenica (2 giorni) vengono scalati dal congedo parentale del lavoratore.',
          secretariatNote:
            'Nota per la Segreteria: "In assenza di formale ripresa di servizio nella giornata di venerdì/lunedì, il SIDI computa automaticamente le giornate di sabato e domenica all’interno del congedo parentale."',
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
          title: 'SABATO E DOMENICA CONTEGGIATI NEL PERIODO DI COMPORTO (MALATTIA CONTINUA)',
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
          secretariatNote:
            'Nota per la Segreteria: "Se il dipendente ha effettuato servizio o se vi è certificazione specifica di guarigione e ricaduta per diversa patologia clinica, verificare l’applicazione del regime di continuità a fini retributivi."',
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
            ruleCode: 'Messaggio INPS 19772 / RTS 108127',
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
            secretariatNote:
              'Nota per la Segreteria: "In base al Messaggio INPS 19772 e orientamento RTS, tra due tipologie di assenza a titolo diverso (es. congedo parentale e malattia) il fine settimana intermedio è neutro e NON deve essere scalato né dal congedo né dal comporto."',
          });
        }
      }
    }
  }

  // 5. Permessi per motivi personali/familiari (Art. 67 CCNL ATA) - Autocertificazione non discrezionale
  for (const abs of absences.filter(a => a.entry.kind === 'personal')) {
    alerts.push({
      id: `aran_personal_rights_${abs.entry.id}`,
      ruleCode: 'Art. 67 CCNL Istruzione e Ricerca (ATA)',
      title: 'PERMESSI PERSONALI ATA: DIRITTO SOGGETTIVO NON DISCREZIONALE',
      severity: 'info_blue',
      affectedDates: [formatIso(abs.startDate)],
      summary: 'Permesso per motivi personali o familiari di 18 ore annuali (o 3 giorni per evento).',
      legalReference: 'Art. 67 c. 2 CCNL 2019-2021 / ARAN Orientamento CIRS115',
      aranInterpretation:
        'I permessi per motivi personali e familiari sono un diritto del dipendente ATA fruibile su semplice autocertificazione (anche motivata genericamente per ragioni di riservatezza). Non sono soggetti a valutazione discrezionale o autorizzazione del Dirigente Scolastico.',
      weekendAccounting: 'neutro',
      consequence: 'Retribuzione intera conservata, nessun obbligo di recupero orario.',
      secretariatNote:
        'Promemoria per la Segreteria: "Ai sensi dell’art. 67 CCNL e orientamento ARAN CIRS115, la fruizione dei permessi orari/giornalieri per motivi personali è subordinata a semplice comunicazione con autocertificazione, senza potere discrezionale di diniego del DS se non per inderogabili e motivate esigenze di servizio."',
    });
  }

  return alerts;
}
