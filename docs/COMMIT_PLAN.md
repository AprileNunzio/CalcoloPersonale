# Fasi predisposte e stato Git

Le voci seguenti descrivono le fasi logiche della base iniziale. Il tentativo di staging locale è stato respinto dal filesystem: impossibile creare `.git/index.lock`. La pubblicazione iniziale utilizza pertanto le API GitHub. Poiché la repository è vuota, è necessaria un’inizializzazione mediante Contents API prima dell’importazione atomica dei sorgenti attraverso Git Trees e Commits.

## Fase 1 — base applicativa

Titolo: `feat: establish ATA desktop workspace and encrypted archive`

Contenuto: struttura React/TypeScript e Rust/Tauri, fascicoli, validazione, archivio cifrato, autosalvataggio iniziale, conteggi descrittivi e documentazione delle funzioni mancanti.

Validazione: controlli JSON e limiti strutturali. Compilazione e test Rust non disponibili a causa delle dipendenze mancanti.

## Fase 2 — ciclo di aggiornamento e protezione del salvataggio

Titolo: `feat(updater): check signed releases at startup and preserve pending edits`

Contenuto: controllo all’avvio, download e installazione automatici, richiesta di riavvio, messaggi di errore, barriera di interazione, chiusura ordinaria con svuotamento della coda e plugin di istanza unica.

Validazione: formattazione Rust e verifica strutturale. Test applicativi ed end-to-end ancora da eseguire.

## Fase 3 — pipeline Windows

Titolo: `build: prepare gated Windows installer and signed GitHub releases`

Contenuto: workflow Windows, configurazione pubblica updater, verifica prerequisiti, pubblicazione subordinata agli asset richiesti, test Python e documentazione operativa.

Validazione: due test Python superati. Pipeline remota non eseguita; lockfile, icona, chiavi e dataset ancora necessari.

## Pubblicazione

Destinazione: branch `main` della repository `AprileNunzio/CalcoloPersonale`, verificata priva di branch prima dell’importazione. La base comprende un commit di inizializzazione e un commit con i sorgenti e la documentazione delle tre fasi. Gli hash effettivi sono consultabili nella cronologia GitHub. Non viene utilizzato force push e la directory `.git` locale resta non sincronizzata. I calcoli normativi completi e la release Windows non sono inclusi fra le funzionalità completate.
