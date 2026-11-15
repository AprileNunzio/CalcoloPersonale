# Procedura di rilascio Windows

## Stato

La pipeline è predisposta nel sorgente e non è stata eseguita su GitHub. Non esiste una release prodotta da questa sessione.

## Condizioni di avvio

1. Accesso in scrittura alla directory `.git` e autenticazione GitHub valida.
2. Connettività verso GitHub, npm, crates.io e i servizi di compilazione.
3. Generazione e versionamento di `package-lock.json` e `src-tauri/Cargo.lock`.
4. Icona Windows valida in `src-tauri/icons/icon.ico`.
5. Completamento dei dataset con provenienza documentata.
6. Completamento e collaudo delle funzionalità dichiarate per la versione.
7. Verifica dei requisiti di sistema e della procedura di aggiornamento su Windows.

Il workflow utilizza `npm ci` e Cargo in modalità locked. L’assenza dei lockfile arresta la compilazione invece di risolvere nuove dipendenze durante una release.

## Firma degli aggiornamenti

Generare la coppia di chiavi con il comando `tauri signer generate` della CLI installata. Conservare la chiave privata e la relativa password fuori dal repository, in un deposito protetto e recuperabile.

Configurare in GitHub:

| Impostazione | Tipo | Contenuto |
| --- | --- | --- |
| `TAURI_UPDATER_PUBLIC_KEY` | Repository variable | Contenuto della chiave pubblica Tauri |
| `TAURI_SIGNING_PRIVATE_KEY` | Actions secret | Chiave privata di firma |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Actions secret | Password della chiave, se impostata |

Non inserire la chiave privata in sorgenti, commit, documentazione, allegati pubblici o log. Non rigenerare arbitrariamente la coppia dopo la prima distribuzione: i client installati devono poter verificare le release successive mediante la chiave già incorporata.

`scripts/configure-release.py` valida il formato della chiave pubblica e produce una configurazione Tauri esclusa da Git. La chiave pubblica non è una credenziale segreta.

La firma updater autentica i pacchetti di aggiornamento. La firma Authenticode dell’installer richiede una configurazione e un certificato distinti, non ancora disponibili. Non è garantita l’assenza di avvisi Windows SmartScreen.

## Ciclo di pubblicazione

1. Registrare le modifiche e le verifiche nel `CHANGELOG.md`.
2. Allineare versione npm, versione Tauri e versione Cargo.
3. Creare commit descrittivi delle fasi effettivamente completate.
4. Pubblicare il branch solo dopo avere confrontato la storia remota.
5. Creare e pubblicare il tag `vX.Y.Z` corrispondente alla versione.
6. GitHub Actions esegue validazione, test e compilazione Windows.
7. La release viene inizialmente creata come bozza.
8. Lo script verifica la presenza di installer NSIS, firma e `latest.json`.
9. Se i controlli riescono, la release viene pubblicata automaticamente e marcata come latest.

Il workflow non è un certificatore di correttezza giuridica e non sostituisce il collaudo funzionale. I controlli sui dataset verificano la presenza di dati e provenienza, non la completezza sostanziale dell’archivio nazionale.

## Comportamento del client

A ogni avvio viene interrogato l’endpoint HTTPS:

```text
https://github.com/AprileNunzio/CalcoloPersonale/releases/latest/download/latest.json
```

Se il plugin rileva una versione più recente, l’applicazione disabilita temporaneamente l’interazione, completa il salvataggio pendente, scarica il pacchetto, ne verifica la firma attraverso il plugin e procede all’installazione e al riavvio.

In caso di errore viene mostrata una segnalazione con possibilità di riprovare o usare la versione corrente. I problemi di aggiornamento non sono trattati come assenza di nuove versioni.

L’aggiornamento non modifica il programma mentre viene eseguito: richiede una breve interruzione e il riavvio. Il controllo è effettuato all’avvio e su richiesta; non è un monitoraggio continuo delle release durante l’intera sessione.

L’endpoint descritto richiede asset accessibili ai client. Un repository privato necessita di un’infrastruttura di distribuzione adeguata; un token GitHub privato non deve essere incorporato nell’eseguibile.

## Collaudo richiesto

- Installazione iniziale su Windows e apertura dell’archivio.
- Pubblicazione di una seconda versione firmata e aggiornamento dalla prima.
- Verifica del mantenimento dei dati e della password dell’archivio.
- Firma errata, rete assente, manifest malformato e download interrotto.
- Errore di scrittura con modifiche pendenti: installazione non avviata.
- Chiusura della finestra durante autosalvataggio.
- Eventuale ripristino della versione precedente senza incompatibilità del formato dati.

Nessuno di questi collaudi desktop risulta ancora completato.
