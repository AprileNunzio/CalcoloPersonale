# Calcolo Personale

Applicazione desktop per Windows destinata alla gestione dei fascicoli del personale amministrativo, tecnico e ausiliario della scuola, con interfaccia TypeScript e backend Rust.

Repository di riferimento: [AprileNunzio/CalcoloPersonale](https://github.com/AprileNunzio/CalcoloPersonale).

**Versione del progetto: 0.1.0 — sviluppo iniziale, non ancora qualificato per l’utilizzo in produzione.**

**Ultimo aggiornamento documentale: 15 novembre 2026.**

Il presente documento distingue il codice già scritto dalle funzionalità effettivamente collaudate e da quelle programmate. La presenza di un modulo sorgente non costituisce attestazione della sua corretta esecuzione, della conformità normativa o della disponibilità di un programma installabile.

## Obiettivo del prodotto

Riunire in un unico ambiente i dati anagrafici, i servizi, i titoli, la situazione familiare e le assenze di più persone. L’obiettivo finale è ricostruire la posizione professionale ATA per anno scolastico e procedura di reclutamento, riducendo l’inserimento manuale e rendendo verificabile ogni calcolo.

La schermata iniziale presenta i fascicoli mediante schede con cognome, nome, profilo e icona associata al genere. Ogni fascicolo dispone di una dashboard e di sezioni dedicate.

## Stato sintetico

| Area | Stato effettivo | Limite attuale |
| --- | --- | --- |
| Applicazione Windows Tauri | Struttura e configurazione presenti | Compilazione desktop non completata |
| Frontend React e TypeScript | Viste e componenti presenti | Controllo TypeScript e collaudo visivo non eseguiti |
| Gestione di più persone | Modello, comandi e interfaccia presenti | Flussi da collaudare nell’applicazione |
| Anagrafica | Inserimento e modifica implementati nel sorgente | Codice fiscale verificato solo strutturalmente |
| Servizi, titoli, famiglia e assenze | Registrazioni e cancellazione presenti | Modelli contrattuali e documentali ancora da estendere |
| Salvataggio in Documenti | Percorso risolto mediante Tauri | Verifica su installazione Windows ancora necessaria |
| Archivio cifrato | AES-256-GCM e Argon2 implementati | Audit di sicurezza e prove di recupero non eseguiti |
| Autosalvataggio | Infrastruttura comune collegata ai moduli anagrafici e alle registrazioni | Chiusura improvvisa, ripristino bozze e concorrenza da completare e collaudare |
| Giorni per anno scolastico | Conteggio Rust implementato | Giorni di calendario registrati, non anzianità giuridicamente riconosciuta |
| Età dei figli | Calcolo Rust implementato | Nessuna attribuzione automatica di benefici |
| Punteggio terza fascia | Programmato | Il risultato attuale è `null` |
| Punteggio e accesso ai 24 mesi | Programmati | Non implementati |
| Ferie, malattia e congedi spettanti | Programmati | Nessun residuo contrattuale calcolato |
| Probabilità di immissione in ruolo | Analisi progettuale programmata | Nessun modello statistico o dato di graduatoria caricato |
| Comuni e scuole | Ricerca Rust e componente di selezione presenti | Archivi JSON attualmente vuoti |
| Compilazione scuola da codice | Collegamento interfaccia-modello predisposto | Non operativo senza importazione degli archivi |
| Italiano e inglese | Dizionari e selettore presenti | Revisione completa dei testi e dell’accessibilità da eseguire |
| Aggiornamenti GitHub | Controllo all’avvio, download, installazione e riavvio presenti nel sorgente | Configurazione di release predisposta; chiavi e collaudo ancora mancanti |
| Installer Windows | Target NSIS e pipeline GitHub Actions predisposti | Installer non generato; icona, lockfile e collaudo da completare |
| API esterne e MCP | Programmati | Nessun server o client implementato |
| Agente Gemini | Programmato | Nessuna integrazione API o gestione chiavi implementata |

## Funzionalità presenti nel codice

### Fascicoli personali

- Creazione di più persone, identificabili mediante UUID.
- Ricerca per cognome e nome.
- Schede con profilo ATA, genere e numero delle registrazioni.
- Apertura della dashboard individuale.
- Modifica dei dati anagrafici.
- Eliminazione del fascicolo con richiesta di conferma.

I campi attualmente previsti comprendono nome, cognome, genere, data di nascita, codice fiscale, profilo e un riferimento facoltativo al comune selezionato.

La selezione del profilo costituisce una classificazione del fascicolo: non certifica il possesso dei requisiti di accesso. Il catalogo dei profili deve essere allineato alla disciplina applicabile prima della distribuzione.

### Registrazioni

Sono previste sezioni per servizi, titoli e attestati, figli e assenze. Le tipologie di assenza comprendono malattia, congedo parentale, ferie, festività soppresse, lutto, donazione del sangue e altre assenze.

Ogni registrazione contiene identificativo, tipologia, descrizione, data iniziale, eventuale data finale e annotazioni. Per i servizi è previsto un riferimento strutturato alla scuola. L’importo numerico facoltativo presente nel modello non viene utilizzato come punteggio riconosciuto.

Non sono ancora implementati allegati documentali, verifica dei certificati, rapporti di lavoro dettagliati, quote orarie, interruzioni valutabili o non valutabili e classificazione completa dei titoli.

### Dashboard e conteggi

Il backend Rust espone un’analisi per anno scolastico, dal 1° settembre al 31 agosto successivo, limitata alla data della rilevazione.

Sono disponibili nel sorgente:

- giorni di calendario coperti dai servizi registrati;
- giorni di calendario coperti dalle assenze registrate;
- eliminazione delle sovrapposizioni all’interno di ciascun conteggio;
- numero dei titoli registrati;
- età dei figli alla data della rilevazione;
- segnalazioni sui limiti interpretativi dei risultati.

Il conteggio include gli estremi dei periodi. In assenza della data finale, una registrazione viene attualmente trattata come un singolo giorno, non come rapporto ancora in corso.

Il numero dei giorni registrati **non equivale** al servizio valutabile per le graduatorie, al requisito dei 24 mesi, ai giorni lavorativi o al residuo di un istituto contrattuale. Le assenze non sono automaticamente sottratte dai servizi: il loro trattamento dipende dalla disciplina applicabile.

### Autosalvataggio

L’infrastruttura condivisa comprende `useAutoDraft`, un contesto applicativo, una coda di scrittura e il comando Rust `save_draft`.

Il comportamento previsto dal codice è il seguente:

1. La modifica del campo aggiorna lo stato dell’interfaccia.
2. Dopo circa 400 millisecondi senza ulteriori modifiche, la coda avvia la scrittura.
3. Le operazioni di autosalvataggio sono serializzate.
4. Le bozze, anche incomplete, vengono incluse nell’archivio cifrato.
5. I dati che superano la validazione vengono riportati nel fascicolo.
6. L’interfaccia segnala salvataggio in corso, completamento o errore con possibilità di ripetizione.

Il salvataggio esplicito e il blocco dell’archivio attendono lo svuotamento della coda. La password non viene inclusa nell’autosalvataggio.

La chiusura ordinaria della finestra ora attende lo svuotamento della coda. È stato aggiunto il plugin di istanza unica. Entrambe le misure richiedono collaudo desktop.

**Da completare:** recupero guidato delle nuove anagrafiche incomplete, isolamento delle bozze per singola sezione e prove sulle modifiche concorrenti. Un’interruzione forzata prima della scrittura può ancora causare la perdita delle ultime modifiche. Il pulsante di annullamento chiude il modulo: non costituisce un ripristino delle modifiche già salvate automaticamente.

### Persistenza e protezione dei dati

L’archivio è destinato alla cartella Documenti dell’utente Windows, individuata tramite le API di sistema:

```text
Documenti/Calcolo Personale/archivio.cpa
```

La cartella effettiva può essere reindirizzata da Windows o da servizi di sincronizzazione. L’applicazione non implementa un proprio servizio cloud.

Il sorgente prevede cifratura autenticata AES-256-GCM, derivazione della chiave dalla password mediante Argon2, sale e nonce casuali, scrittura su file temporaneo e sostituzione del file finale. Alcuni buffer crittografici utilizzano `zeroize`.

Sono presenti un blocco manuale e un blocco dopo circa cinque minuti di inattività rilevata nell’interfaccia. La password deve contenere almeno dodici caratteri. Non è disponibile una procedura di recupero della password.

Queste misure non costituiscono una certificazione di sicurezza. Non sono ancora disponibili backup automatici, ripristino assistito, migrazioni complete del formato, audit degli accessi, verifica delle ACL o cancellazione verificata di tutti i dati personali dalla memoria. Il plugin di istanza unica non sostituisce il collaudo degli accessi concorrenti al file.

### Comuni e scuole

Sono presenti un motore di ricerca locale e un componente con suggerimenti utilizzabile da tastiera. La ricerca accetta codice o denominazione e restituisce al massimo trenta risultati; le corrispondenze esatte sul codice hanno priorità.

Il modello scuola prevede codice meccanografico, denominazione, comune, provincia, regione, indirizzo, CAP, email, PEC, sito web, anno scolastico e categoria. La selezione compila i campi disponibili nel record sorgente.

**Gli archivi nazionali non sono stati scaricati.** I file `schools.json` e `municipalities.json` contengono elenchi vuoti e dichiarano lo stato `download_required`. Non sono presenti dati dimostrativi presentati come reali. In assenza dell’archivio, l’interfaccia comunica l’indisponibilità della ricerca.

L’importazione dovrà comprendere copertura, provenienza, licenza, data di aggiornamento, anno scolastico e controllo di integrità. Per le scuole occorre verificare separatamente statali, paritarie e istituzioni delle autonomie territoriali; un singolo dataset non autorizza a dichiarare completa la copertura nazionale. Per i comuni di nascita serviranno anche denominazioni storiche e comuni soppressi.

## Funzionalità programmate

### Motore normativo ATA

- Regole versionate per procedura, profilo, anno di domanda e periodo di validità.
- Calcolo del punteggio di terza fascia con dettaglio di ogni contributo.
- Valutazione separata dei titoli di accesso, culturali e di servizio.
- Calcolo del servizio e dei titoli per le graduatorie provinciali permanenti dei 24 mesi.
- Verifica distinta del requisito temporale e degli ulteriori requisiti di ammissione.
- Gestione di periodi sovrapposti, interruzioni, servizi in altri profili e tipologie di istituzione.
- Ricostruzione di mesi interi e frazioni secondo la regola applicabile, senza equiparare indiscriminatamente ogni mese a trenta giorni.
- Tracciabilità delle fonti, degli arrotondamenti, dei massimali e delle esclusioni.
- Casi di prova ricavati da esempi verificati e controllo delle variazioni normative.

Il motore non dovrà attribuire un punteggio quando mancano dati essenziali o una regola validata. Le disposizioni di un triennio non saranno automaticamente estese alle procedure successive.

### Istituti contrattuali e famiglia

Sono programmati il calcolo di maturato, fruito e residuo per ferie, festività soppresse, malattia e congedi, oltre alla gestione di lutto, donazione del sangue e altri permessi.

Le regole dovranno considerare contratto, durata, anzianità, orario, part-time, calendario lavorativo, eventi, certificazioni e disciplina vigente. Per i figli dovranno essere gestiti anche adozione, affidamento, periodi già fruiti e condizioni dell’altro genitore, ove rilevanti. La sola data di nascita non determina l’intero diritto spettante.

### Prospettive di immissione in ruolo

È programmata una sezione di analisi territoriale collegata al comune indicato dall’utente e alla provincia competente.

Il comune, da solo, non consente una probabilità attendibile. Occorreranno almeno profilo, posizione nella graduatoria pertinente, posti autorizzati, disponibilità, riserve, precedenze e andamento storico delle assunzioni.

La prima implementazione dovrà distinguere scenari deterministici, copertura dei dati e incertezza. Un’eventuale percentuale richiederà un modello documentato, dati adeguati e validazione statistica. Nessuna percentuale sarà prodotta come valore arbitrario o garanzia di assunzione.

### API, MCP e Gemini

Sono programmate interfacce API e integrazioni con Model Context Protocol. I comandi Tauri esistenti costituiscono comunicazione interna tra interfaccia e backend: **non sono un’API HTTP né un server MCP**.

La progettazione dovrà definire autenticazione, autorizzazioni per operazione, limiti alle richieste, versionamento, tracciabilità e accesso minimo ai fascicoli. Le operazioni di lettura dovranno essere distinte da quelle che modificano o esportano dati.

L’agente Gemini, da integrare mediante API key, è previsto per richieste in linguaggio naturale, spiegazioni e assistenza alla compilazione. Sono ancora da realizzare:

- custodia protetta e revoca della chiave API;
- chiamate dal backend, senza esposizione della chiave nei log;
- scelta del modello, gestione dei limiti e degli errori del servizio;
- selezione e anteprima dei dati da trasmettere;
- autorizzazione esplicita all’invio di dati personali;
- controllo delle azioni proposte dall’agente;
- separazione fra risposta generativa e calcolo normativo deterministico.

Attualmente il software non invia richieste a Gemini e non contiene strumenti autonomi per modificare i fascicoli tramite un modello linguistico.

### Distribuzione Windows

Sono programmati icona originale, completamento dei metadati, collaudo di installazione e disinstallazione e firma Authenticode. Target NSIS e pipeline GitHub Windows sono presenti nel sorgente, ma non eseguiti.

Il client ora controlla gli aggiornamenti all’avvio e su richiesta. Il sorgente prevede download automatico, salvataggio delle modifiche pendenti, installazione e riavvio. In caso di errore viene consentito di riprovare o utilizzare la versione corrente. Non è previsto il monitoraggio continuo delle release durante una sessione.

La pipeline prepara una release in bozza e ne pubblica gli asset solo dopo i controlli previsti. L’endpoint GitHub è definito nello script di configurazione; occorrono ancora chiave pubblica, segreti di firma, lockfile, icona e collaudo completo. La firma degli aggiornamenti Tauri e la firma Authenticode del programma sono controlli distinti.

Dettagli in [docs/RELEASE.md](docs/RELEASE.md), [CHANGELOG.md](CHANGELOG.md) e [docs/COMMIT_PLAN.md](docs/COMMIT_PLAN.md).

## Organizzazione del progetto

| Percorso | Responsabilità |
| --- | --- |
| `src/features/boot` | Avvio, navigazione e struttura dell’interfaccia |
| `src/features/people` | Modulo anagrafico |
| `src/features/records` | Inserimento e gestione delle registrazioni |
| `src/features/dashboard` | Presentazione delle analisi |
| `src/features/autosave` | Bozze, coda e stato del salvataggio |
| `src/features/directory` | Ricerca e selezione di comuni e scuole |
| `src/shared` | Tipi condivisi, traduzioni e adattatore Tauri |
| `src-tauri/src/people` | Modello dei fascicoli e validazione |
| `src-tauri/src/analysis` | Conteggi e test del dominio |
| `src-tauri/src/vault` | Archivio, cifratura e persistenza |
| `src-tauri/src/directory` | Ricerca negli archivi nazionali |
| `src-tauri/src/shared` | Contratto degli errori |
| `src-tauri/resources` | Risorse degli archivi, attualmente prive dei dataset |
| `scripts` | Script di lavorazione del progetto |

L’organizzazione è per funzionalità. Clean Architecture, separazione delle responsabilità e dominio Rust costituiscono i criteri di sviluppo. L’isolamento dei livelli e la scomposizione dei componenti principali richiedono ulteriore rifinitura: non viene dichiarata una conformità architetturale già verificata.

I sorgenti applicativi non contengono commenti esplicativi. Il limite stabilito è di 500 righe per file; deve essere mantenuto anche dopo la formattazione. Il volume attuale del frontend è significativo: l’obiettivo di concentrare prevalentemente in Rust la logica applicativa resta da consolidare.

## Avvio per sviluppo

Prerequisiti: Windows con toolchain Rust/MSVC, strumenti C++ necessari a Tauri, WebView2, Node.js e npm, oltre all’accesso ai registri delle dipendenze. Le versioni effettivamente compatibili dovranno essere confermate con una compilazione riproducibile.

```powershell
npm install
npm run desktop
```

Verifica del frontend e test Rust:

```powershell
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Generazione dell’installer, dopo avere completato risorse e requisiti di compilazione:

```powershell
npm run installer
```

`npm run dev` avvia soltanto l’interfaccia web. I comandi dell’archivio richiedono il processo Tauri e non funzionano nel browser ordinario.

## Verifiche e impedimenti riscontrati

Durante la preparazione iniziale:

- la directory di lavoro era vuota;
- il clone da GitHub è fallito per un problema di risoluzione di rete;
- è stato inizializzato un repository Git locale con il remote indicato;
- l’installazione npm è fallita con `ENOTFOUND` sul registro delle dipendenze;
- `cargo test --offline` è fallito perché `aes-gcm` non è disponibile nella cache locale;
- il download diretto dell’archivio ISTAT non è riuscito per mancata risoluzione dell’host;
- alcune pagine del catalogo MIM hanno restituito HTTP 403 durante la consultazione.

Sono presenti due test Rust sul confine dell’anno scolastico e sul conteggio di periodi sovrapposti limitato alla data di riferimento. **Non sono stati eseguiti con successo**, poiché la risoluzione delle dipendenze è bloccata. Sono invece stati eseguiti con successo due test Python sul formato della chiave pubblica updater e sulla configurazione HTTPS; risultano superati anche il controllo strutturale e la formattazione Rust.

Non sono disponibili un installer verificato, una release pubblicata, un audit di sicurezza o una validazione giuridica dei calcoli. Il tentativo iniziale di commit locale è fallito per accesso negato a `.git/index.lock`; la CLI GitHub ha inoltre segnalato credenziali non valide. Il collegamento GitHub successivamente attivato consente la pubblicazione tramite API: la repository è stata verificata come vuota prima dell’importazione iniziale. La cronologia remota costituisce il riferimento per gli hash effettivi; il checkout locale non viene dichiarato sincronizzato.

## Priorità operative

1. Ripristinare l’accesso alle dipendenze, confrontare il repository remoto e ottenere una compilazione riproducibile.
2. Completare il ciclo di vita dell’autosalvataggio, il ripristino delle bozze e la gestione della concorrenza.
3. Importare e verificare gli archivi ufficiali di comuni e scuole, documentandone la copertura.
4. Completare dati contrattuali, titoli, allegati e requisiti delle procedure ATA.
5. Implementare e validare separatamente terza fascia, 24 mesi e istituti contrattuali.
6. Realizzare API/MCP e assistente Gemini con autorizzazioni e protezione dei dati.
7. Introdurre analisi territoriali solo in presenza di basi informative adeguate.
8. Completare accessibilità, collaudo Windows, icona, installer, firme e aggiornamenti GitHub.

## Fonti di riferimento

- [MIM — Informazioni utili sulle graduatorie ATA](https://graduatorie-ata.static.istruzione.it/informazioni-utili.html).
- [MIM — Catalogo Open Data](https://dati.istruzione.it/opendata/opendata/catalogo/).
- [ISTAT — Codici delle unità amministrative](https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/).
- [ISTAT — Elenco dei comuni italiani, permalink XLSX](https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx).
- [Google — Documentazione Gemini API](https://ai.google.dev/api).
- [Model Context Protocol — Specifica](https://modelcontextprotocol.io/specification/2025-11-25).

I collegamenti identificano fonti da consultare e verificare. Non implicano che i relativi dati siano già incorporati, che tutte le disposizioni siano state analizzate o che le integrazioni risultino operative.

## Licenza

Non è ancora stata aggiunta una licenza software al repository. Prima della distribuzione dovranno essere definite le condizioni d’uso e verificate le licenze di dipendenze, icone e dataset.
