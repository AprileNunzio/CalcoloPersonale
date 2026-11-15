# Registro delle modifiche

## 0.1.0 — non rilasciata

### Base applicativa

- Struttura desktop Tauri con frontend React/TypeScript e backend Rust.
- Fascicoli personali, registrazioni, dashboard e conteggio dei giorni di calendario.
- Archivio cifrato nella cartella Documenti e autosalvataggio delle bozze.
- Componenti per ricerca di scuole e comuni; dataset ancora da acquisire.

### Distribuzione e aggiornamenti

- Controllo aggiornamenti automatico all’avvio e richiamo manuale.
- Download, installazione e richiesta di riavvio mediante plugin Tauri.
- Interfaccia temporaneamente disabilitata durante le operazioni di aggiornamento.
- Svuotamento della coda di autosalvataggio prima dell’installazione.
- Chiusura ordinaria della finestra subordinata al completamento del salvataggio.
- Plugin di istanza unica per limitare accessi simultanei allo stesso archivio.
- Pipeline Windows con controlli, compilazione, test e preparazione della release.
- Configurazione updater derivata dalla chiave pubblica di repository; nessuna chiave privata incorporata.
- Controllo della presenza di installer, firma e manifest prima della pubblicazione.

### Verifiche eseguite

- Due test Python della configurazione di firma superati.
- Controllo strutturale dei sorgenti e dei JSON superato.
- Formattazione Rust eseguita.

### Impedimenti

- Commit locale impedito dall’accesso negato a `.git/index.lock`.
- Pubblicazione iniziale gestita mediante il collegamento GitHub, senza push dalla CLI locale.
- Nessuna compilazione desktop: dipendenze non scaricabili e cache incompleta.
- Nessun installer o aggiornamento distribuito.
- Calcoli normativi completi, dataset nazionali, Gemini, API e MCP ancora da implementare o completare secondo il README.
