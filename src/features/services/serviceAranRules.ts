import type { Entry } from '../../shared/types';
import { formatDateItalian } from '../../shared/dateUtils';

export interface ServiceAranAlert {
  id: string;
  ruleCode: string;
  title: string;
  severity: 'critical_red' | 'warning_amber' | 'info_blue';
  summary: string;
  legalReference: string;
  aranInterpretation: string;
  consequence: string;
  secretariatNote: string;
}

function parseIso(dStr: string | null | undefined): Date | null {
  if (!dStr) return null;
  const parts = dStr.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

function getDayDiff(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function analyzeServiceAranRules(
  currentService: Entry,
  allRecords: Entry[]
): ServiceAranAlert[] {
  const alerts: ServiceAranAlert[] = [];
  if (currentService.kind !== 'service' || !currentService.start) return alerts;

  const currentStart = parseIso(currentService.start);
  const currentEnd = parseIso(currentService.end || currentService.start);
  if (!currentStart || !currentEnd) return alerts;

  let parsedNotes: Record<string, unknown> = {};
  try {
    if (currentService.notes?.startsWith('{')) {
      parsedNotes = JSON.parse(currentService.notes);
    }
  } catch {
    parsedNotes = {};
  }

  const weeklyHours = typeof parsedNotes.weeklyHours === 'number' ? parsedNotes.weeklyHours : null;
  const sector = String(parsedNotes.sector || '');

  // 1. Art. 40 c. 3 CCNL Comparto Scuola & Orientamento ARAN: Continuità didattica/servizio e Proroga Weekend
  // Se un contratto inizia di lunedì e ce n'era uno terminato il venerdì precedente con la medesima scuola e profilo
  const otherServices = allRecords
    .filter(r => r.kind === 'service' && r.id !== currentService.id)
    .map(r => ({
      entry: r,
      start: parseIso(r.start),
      end: parseIso(r.end || r.start),
    }))
    .filter((s): s is { entry: Entry; start: Date; end: Date } => s.start !== null && s.end !== null);

  for (const prev of otherServices) {
    const diff = getDayDiff(prev.end, currentStart);
    // prev termina di venerdì (getDay() === 5) e current inizia di lunedì (getDay() === 1) con 3 giorni di distacco (sabato e domenica intermedi)
    if (diff === 3 && prev.end.getDay() === 5 && currentStart.getDay() === 1) {
      const sameSchool =
        Boolean(prev.entry.school?.code && currentService.school?.code && prev.entry.school.code === currentService.school.code) ||
        Boolean(prev.entry.title && currentService.title && prev.entry.title.trim().toLowerCase() === currentService.title.trim().toLowerCase());
      const sameProfile = (prev.entry.profile || 'CS') === (currentService.profile || 'CS');

      if (sameSchool && sameProfile) {
        alerts.push({
          id: `service_aran_weekend_proroga_${prev.entry.id}_${currentService.id}`,
          ruleCode: 'Art. 40 c. 3 CCNL Scuola & ARAN',
          title: 'DIRITTO ALLA PROROGA CONTRATTUALE CON SABATO E DOMENICA RETRIBUITI',
          severity: 'critical_red',
          summary: `Il contratto inizia di lunedì (${formatDateItalian(currentService.start)}) dopo un contratto terminato il venerdì precedente (${formatDateItalian(prev.entry.end || prev.entry.start)}) nella stessa scuola e profilo.`,
          legalReference: 'Art. 40 comma 3 CCNL Comparto Scuola - Nota MIUR prot. 13650 - Orientamento ARAN',
          aranInterpretation:
            'Qualora il titolare si assenti senza soluzione di continuità o l’esigenza di servizio prosegua dal lunedì, la segreteria ha l’obbligo giuridico di emettere una proroga contrattuale comprendente il sabato e la domenica intermedi sia ai fini economici che del punteggio di servizio.',
          consequence:
            'Se la segreteria ha spezzato il contratto escludendo il weekend, stai perdendo 2 giorni di retribuzione e 2 giorni di anzianità di servizio!',
          secretariatNote:
            'Diffida / Richiesta formale per la Segreteria: "Al Dirigente Scolastico e al DSGA: Si richiede formale rettifica e proroga contrattuale ai sensi dell’art. 40 comma 3 CCNL con inclusione del sabato e della domenica intermedi, sussistendo continuità di servizio tra il venerdì e il lunedì successivo senza interruzione per lo stesso profilo."',
        });
      }
    }
  }

  // 2. Controllo massimale orario ATA (Art. 58 CCNL 2019-2021 / 2024)
  if (weeklyHours !== null) {
    if (weeklyHours > 36) {
      alerts.push({
        id: `service_hours_excess_${currentService.id}`,
        ruleCode: 'Art. 58 CCNL Istruzione e Ricerca',
        title: 'SUPERAMENTO ORARIO CONTRATTUALE MASSIMO ATA (36 ORE)',
        severity: 'critical_red',
        summary: `Hai inserito ${weeklyHours} ore settimanali per questo servizio. L’orario ordinario di lavoro a tempo pieno per il personale ATA è di 36 ore.`,
        legalReference: 'Art. 58 CCNL 2019-2021 e CCNL 18/01/2024',
        aranInterpretation:
          'Il completamento d’orario per il personale ATA con contratto a tempo determinato può realizzarsi nel limite massimo di 36 ore settimanali e su non più di tre sedi/scuole.',
        consequence: 'Le ore eccedenti le 36 settimanali non possono essere riconosciute contrattualmente né retribuite come orario ordinario.',
        secretariatNote:
          'Da verificare con la segreteria: accertarsi che il contratto sia stato registrato con il corretto monte ore part-time o tempo pieno (max 36 ore).',
      });
    } else if (weeklyHours < 6 && weeklyHours > 0) {
      alerts.push({
        id: `service_hours_low_${currentService.id}`,
        ruleCode: 'Ordinanza Ministeriale Supplenze ATA',
        title: 'SPEZZONE ORARIO INFERIORE AL MINIMO CONTRATTUALE',
        severity: 'warning_amber',
        summary: `Hai indicato ${weeklyHours} ore settimanali. Gli spezzoni orari minimi conferibili sono di norma pari a 6 ore settimanali.`,
        legalReference: 'Regolamento Supplenze ATA (D.M. 430/2000)',
        aranInterpretation: 'L’assegnazione di spezzoni orari inferiori alle 6 ore è consentita solo per completamento residuo orario.',
        consequence: 'Verificare che lo spezzone sia regolarmente abbinato a completamento con altro contratto.',
        secretariatNote: 'Richiedere alla segreteria la verifica della compatibilità oraria con altre istituzioni scolastiche.',
      });
    }
  }

  // 3. Servizio in Scuole Paritarie o Legalmente Riconosciute (D.M. 89/2024)
  if (sector === 'paritaria_ata' || currentService.school?.category === 'SCUANAGRAFEPA') {
    alerts.push({
      id: `service_paritaria_halved_${currentService.id}`,
      ruleCode: 'D.M. 89/2024 Tabella Valutazione Titoli ATA',
      title: 'VALUTAZIONE DIMEZZATA AL 50% PER SERVIZIO NON STATALE / PARITARIO',
      severity: 'info_blue',
      summary: 'Il servizio prestato in scuole paritarie o legalmente riconosciute viene valutato la metà rispetto alle scuole statali.',
      legalReference: 'D.M. 89 del 21 maggio 2024 - Note esplicative graduatorie terze fasce ATA',
      aranInterpretation:
        'Il servizio prestato nelle scuole paritarie o private dà diritto a 0,25 punti per ogni mese o frazione superiore a 15 giorni per il medesimo profilo (anziché 0,50 punti delle scuole statali).',
      consequence: 'Il punteggio calcolato automaticamente dal sistema applica la riduzione al 50% prevista dalle tabelle ministeriali.',
      secretariatNote:
        'Nota di verifica: conservare il certificato di servizio originale con indicazione della presa di servizio, qualifica e versamento contributivo INPS.',
    });
  }

  // 4. Servizio di Ruolo con retrodatazione giuridica (Art. 39 CCNL)
  if (parsedNotes.isRuolo && parsedNotes.legalEffectDate && parsedNotes.economicEffectDate) {
    const legalDate = String(parsedNotes.legalEffectDate);
    const econDate = String(parsedNotes.economicEffectDate);
    if (legalDate !== econDate) {
      alerts.push({
        id: `service_ruolo_split_effect_${currentService.id}`,
        ruleCode: 'Art. 39 CCNL - Decorrenza Giuridica ed Economica Ruolo',
        title: 'DECORRENZA RUOLO RETRODATA: BENEFICIO ANZIANITÀ E RICOSTRUZIONE CARRIERA',
        severity: 'info_blue',
        summary: `Decorrenza giuridica fissata al ${formatDateItalian(legalDate)} ed economica al ${formatDateItalian(econDate)}.`,
        legalReference: 'Testo Unico D.Lgs. 297/1994 - Art. 39 CCNL',
        aranInterpretation:
          'Il periodo intercorrente tra la decorrenza giuridica e quella economica è utile a tutti gli effetti ai fini dell’anzianità di servizio e della ricostruzione di carriera.',
        consequence: 'I mesi di retrodatazione giuridica concorrono pienamente al computo dell’anzianità di servizio per la mobilità e la ricostruzione carriera.',
        secretariatNote:
          'Da richiedere alla segreteria al termine dell’anno di prova: emissione del decreto di conferma in ruolo e successivo decreto di ricostruzione di carriera.',
      });
    }
  }

  return alerts;
}
