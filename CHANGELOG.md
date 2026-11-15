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

- Il primo workflow ha individuato l’assenza dei lockfile; aggiunta generazione iniziale sui branch di sviluppo.
- Il successivo controllo TypeScript ha rilevato due icone non esportate da Lucide; sostituite con componenti SVG locali.
- La compilazione frontend del commit `2c143f6` è riuscita su Windows; verifica Rust in prosecuzione.
- Aggiunti test Rust per cifratura, password errata, alterazione dei dati, bozze incomplete e conflitti di revisione; esito da verificare nella pipeline.
- Separate le bozze per sezione e le modifiche delle registrazioni da quelle anagrafiche, evitando la sostituzione integrale dei servizi durante una modifica dell’identità.

- Due test Python della configurazione di firma superati.
- Controllo strutturale dei sorgenti e dei JSON superato.
- Formattazione Rust eseguita.

### Impedimenti

- Commit locale impedito dall’accesso negato a `.git/index.lock`.
- Pubblicazione iniziale gestita mediante il collegamento GitHub, senza push dalla CLI locale.
- Nessuna compilazione desktop: dipendenze non scaricabili e cache incompleta.
- Nessun installer o aggiornamento distribuito.
- Calcoli normativi completi, dataset nazionali, Gemini, API e MCP ancora da implementare o completare secondo il README.
