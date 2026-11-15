# Registro delle modifiche

## 0.1.0


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

### Integrazioni in verifica

- Assistente Gemini con credenziale Windows, elenco modelli restituito dal provider e invio autorizzato del solo testo della richiesta.
- Bozza cifrata dell’ultima richiesta e risposta; nessuna trasmissione automatica dei fascicoli.
- Importatore ISTAT XLSX e quattro categorie MIM per l’anno scolastico 2026/27, con hash e provenienza dei download.
- Workflow di importazione con soli permessi di lettura della repository e produzione di artefatti; non esegue commit o push.

### Verifiche eseguite

- Il primo workflow ha individuato l’assenza dei lockfile; aggiunta generazione iniziale sui branch di sviluppo.
- Il successivo controllo TypeScript ha rilevato due icone non esportate da Lucide; sostituite con componenti SVG locali.
- La compilazione frontend del commit `2c143f6` è riuscita su Windows; verifica Rust in prosecuzione.
- Aggiunti test Rust per cifratura, password errata, alterazione dei dati, bozze incomplete e conflitti di revisione; esito da verificare nella pipeline.
- Separate le bozze per sezione e le modifiche delle registrazioni da quelle anagrafiche, evitando la sostituzione integrale dei servizi durante una modifica dell’identità.

- Due test Python della configurazione di firma superati.
- Controllo strutturale dei sorgenti e dei JSON superato.
- Formattazione Rust eseguita.

### Stato del rilascio

- Lockfile di dipendenze `package-lock.json` e `src-tauri/Cargo.lock` integrati e bloccati.
- Dataset nazionali completi ufficiali MIM e ISTAT incorporati nell'applicazione.
- Chiave pubblica updater configurata come repository variable e chiave privata di firma impostata come secret.
- Pipeline Windows predisposta per firmare gli installer NSIS e pubblicare il manifest di auto-aggiornamento.

