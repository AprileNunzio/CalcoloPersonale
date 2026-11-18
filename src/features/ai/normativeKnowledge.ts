/**
 * RAG Normativo ATA: Base di conoscenza ufficiale del comparto Istruzione e Ricerca.
 * Include le disposizioni del D.M. 89/2024, CCNL 18 gennaio 2024, D.Lgs. 297/94 e D.Lgs. 22/2015.
 */

export interface NormativeArticle {
  id: string;
  title: string;
  keywords: string[];
  content: string;
}

export const NORMATIVE_KNOWLEDGE_BASE: NormativeArticle[] = [
  {
    id: 'ciad_ccnl_2024',
    title: 'Obbligo CIAD (CCNL 18/01/2024 e D.M. 89/2024)',
    keywords: ['ciad', 'alfabetizzazione', 'digitale', 'accredia', 'patentino', 'requisito'],
    content: `[NORMATIVA CIAD - CCNL 18/01/2024 e D.M. 89/2024]
- La Certificazione Internazionale di Alfabetizzazione Digitale (CIAD) rilasciata da ente accreditato Accredia è REQUISITO DI ACCESSO OBBLIGATORIO per tutti i profili ATA (AA, AT, OS, CU, GU, CR) TRANNE che per il Collaboratore Scolastico (CS).
- Proroga ministeriale: Coloro che erano già inseriti nelle graduatorie 2021 o hanno presentato domanda nel 2024 hanno tempo fino al 30 APRILE 2025 per acquisire e registrare la certificazione, pena la decadenza dalla relativa graduatoria.
- La CIAD, essendo requisito di accesso per i profili sopra indicati, NON attribuisce ulteriore punteggio come titolo culturale quando utilizzata come requisito.`,
  },
  {
    id: 'dm89_scoring_rules',
    title: 'Regole di calcolo punteggio III Fascia (D.M. 89/2024)',
    keywords: ['punteggio', 'calcolo', 'mese', 'frazione', 'giorni', '15 giorni', 'massimale', '6 punti'],
    content: `[REGOLE CALCOLO PUNTEGGIO SERVIZIO - D.M. 89/2024]
- Mesi interi e frazioni: Il servizio è calcolato a mesi interi (30 giorni). Le frazioni superiori a 15 giorni si arrotondano a 1 mese intero (es. 16 giorni = 1 mese intero; 15 giorni = 0 mesi).
- Servizio specifico (nello stesso profilo): 0,50 punti al mese (fino a un massimo di 6,00 punti per anno scolastico dal 1° settembre al 31 agosto).
- Servizio in altro profilo ATA o servizio docente:
  * Per il profilo CS: 0,15 punti al mese (max 1,80 punti per anno scolastico).
  * Per i profili AA, AT, CU, GU, CR: 0,10 punti al mese (max 1,20 punti per anno scolastico).
- Servizio prestato in scuole paritarie o legalmente riconosciute: valutato al 50% rispetto al servizio statale (es. 0,25 punti/mese anziché 0,50).`,
  },
  {
    id: 'first_tier_24_months',
    title: 'Requisiti Graduatorie Permanenti 24 Mesi (Art. 554 D.Lgs. 297/94)',
    keywords: ['24 mesi', 'prima fascia', '1 fascia', 'ruolo', '706', '23 mesi', 'statale'],
    content: `[ACCESSO AI 24 MESI (I FASCIA ATA) - Art. 554 D.Lgs. 297/1994]
- Requisito di servizio: 23 mesi e 16 giorni di servizio effettivo (pari a 706 giorni di calendario) prestati anche non continuativamente in scuole statali nel profilo richiesto o profili immediatamente superiori.
- Il servizio prestato come docente NON è computabile per il raggiungimento dei 706 giorni dei 24 mesi ATA (Ordinanza Ministeriale annuale).
- Il servizio prestato in scuole paritarie NON è valido per l'accesso ai 24 mesi ATA statali.
- La graduatoria 24 mesi dà diritto all'immissione in ruolo (a tempo indeterminato) in base alle disponibilità provinciali del contingente autorizzato dal Ministero.`,
  },
  {
    id: 'reclamo_autotutela',
    title: 'Reclamo Avverso le Graduatorie Provvisorie',
    keywords: ['reclamo', 'ricorso', 'autotutela', 'provvisoria', '10 giorni', 'capofila', 'errore punteggio'],
    content: `[RECLAMO AVVERSO GRADUATORIE PROVVISORIE - Art. 8 D.M. 89/2024]
- Termine perentorio: Il reclamo motivato deve essere presentato entro 10 giorni dalla pubblicazione della graduatoria provvisoria all'Albo pretorio dell'istituto capofila.
- Destinatario: Dirigente Scolastico della Scuola Capofila (scuola scelta come istituzione destinataria della domanda).
- Canali di trasmissione: PEC istituzionale o raccomandata A/R o consegna a mano con ricevuta di protocollo.
- Normativa di riferimento: Art. 8 D.M. 89/2024 e potere di autotutela amministrativa ex art. 21-nonies Legge 241/1990.`,
  },
  {
    id: 'naspi_supplenti',
    title: 'Indennità di Disoccupazione NASpI per Supplenti ATA',
    keywords: ['naspi', 'disoccupazione', 'inps', '30 giugno', 'supplenza', 'decalage', '68 giorni'],
    content: `[INDENNITÀ NASPI PER SUPPLENTI DELLA SCUOLA - D.Lgs. 22/2015]
- Requisiti: Almeno 13 settimane di contribuzione negli ultimi 4 anni precedenti la cessazione contrattuale e 30 giorni di lavoro effettivo nei 12 mesi precedenti.
- Durata: Metà delle settimane lavorate/contribuite negli ultimi 4 anni (es. contratto annuale di 42 settimane dà diritto a 21 settimane di NASpI ~ 5 mesi).
- Importo: 75% della retribuzione media mensile imponibile fino alla soglia INPS (circa 1.425 €), con massimale di 1.550 € lordi.
- Décalage: Riduzione progressiva dell'importo del 3% ogni mese a partire dal sesto mese di fruizione (o dall'ottavo mese se l'età anagrafica è pari o superiore a 55 anni).
- Termini: Presentare domanda tassativamente entro 68 giorni dalla fine del contratto (entro 8 giorni per ottenere la decorrenza immediata).`,
  },
  {
    id: 'congedi_e_famiglia',
    title: 'Congedi Parentali e Malattia Personale ATA (CCNL 2024)',
    keywords: ['congedo', 'parentale', 'malattia', 'figli', 'comporto', 'ferie', '104'],
    content: `[CONGEDI E ASSENZE PERSONALE ATA - D.Lgs. 151/2001 e CCNL 2024]
- Congedo parentale: Spettante fino al 12° anno di vita del figlio (per un massimo di 10 o 11 mesi tra entrambi i genitori).
  * Il primo mese di congedo parentale è retribuito al 100% (se fruito entro i 6 anni per il personale della scuola).
  * Secondo e terzo mese retribuiti all'80% o 60% in base alle recenti leggi di bilancio.
- Malattia (periodo di comporto per tempo indeterminato): 18 mesi retribuiti (9 mesi al 100%, 3 mesi al 90%, 6 mesi al 50%). Per supplenti brevi: 30 giorni per anno scolastico retribuiti al 50%.
- Titoli di preferenza familiari: La presenza di figli a carico costituisce titolo di preferenza a parità di punteggio (Art. 5 D.P.R. 487/1994).`,
  },
];

export function getRelevantNormativeContext(query: string): string {
  const q = query.toLowerCase();
  const matched = NORMATIVE_KNOWLEDGE_BASE.filter(item =>
    item.keywords.some(kw => q.includes(kw))
  );

  // If specific keywords matched, return them; otherwise return the core summary
  const chosen = matched.length > 0 ? matched : NORMATIVE_KNOWLEDGE_BASE.slice(0, 3);
  const contextStr = chosen.map(c => `### ${c.title}\n${c.content}`).join('\n\n');
  return `\n\n[FONTI NORMATIVE CERTIFICATE APPLICABILI]:\n${contextStr}\n`;
}
