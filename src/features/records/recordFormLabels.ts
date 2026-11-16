export function getTitleLabel(kind: string): string {
  switch (kind) {
    case 'sickness':
      return 'Tipologia assenza / Riferimento certificato';
    case 'specialist':
      return 'Prestazione sanitaria / Struttura medica';
    case 'qualification':
      return 'Denominazione del titolo o attestato';
    case 'service':
      return 'Denominazione incarico / Istituzione scolastica';
    case 'child':
      return 'Nome e cognome del familiare';
    case 'holiday':
      return 'Motivo assenza / Periodo fruito';
    case 'parental':
      return 'Riferimento congedo parentale';
    default:
      return 'Descrizione / Riferimento';
  }
}

export function getTitlePlaceholder(kind: string): string {
  switch (kind) {
    case 'sickness':
      return 'es. Malattia ordinaria (Numero protocollo certificato INPS / telematico)';
    case 'specialist':
      return 'es. Visita specialistica ospedaliera (18 ore annue)';
    case 'qualification':
      return 'es. Diploma di Maturità Liceo, CIAD, Corso Dattilografia...';
    case 'service':
      return 'es. Contratto 30 giugno / Supplenza breve - I.C. Statale...';
    case 'child':
      return 'es. Nome e cognome familiare convivente o a carico';
    default:
      return 'Descrizione...';
  }
}

export function getStartLabel(kind: string): string {
  switch (kind) {
    case 'qualification':
      return 'Data di conseguimento del titolo';
    case 'service':
      return 'Data inizio servizio / contratto';
    case 'child':
      return 'Data di nascita';
    case 'sickness':
      return 'Data inizio assenza per malattia';
    case 'specialist':
      return 'Data visita specialistica';
    case 'parental':
      return 'Data inizio congedo';
    case 'holiday':
      return 'Data inizio ferie';
    default:
      return 'Data iniziale';
  }
}
