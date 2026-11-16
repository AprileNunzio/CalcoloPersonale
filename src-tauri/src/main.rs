#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod analysis;
mod directory;
mod gemini;
mod ota;
mod people;
mod probability;
mod shared;
mod vault;
use shared::{Error, Result};
use std::sync::Arc;
use tauri::{Manager, State, WebviewUrl, WebviewWindowBuilder};
use vault::{Archive, Vault};

#[tauri::command]
fn unlock(password: String, state: State<'_, Vault>) -> Result<Archive> {
    state.unlock(zeroize::Zeroizing::new(password))
}

#[tauri::command]
fn lock(state: State<'_, Vault>) -> Result<()> {
    *state.session.lock().map_err(|_| Error::Locked)? = None;
    Ok(())
}

#[tauri::command]
fn save_draft(key: String, value: serde_json::Value, state: State<'_, Vault>) -> Result<Archive> {
    state.save_draft(key, value)
}

#[tauri::command]
fn save_person(person: people::Person, revision: u64, state: State<'_, Vault>) -> Result<Archive> {
    let id = person.id;
    state.update(Some(person), id, revision)
}

#[tauri::command]
fn delete_person(id: uuid::Uuid, revision: u64, state: State<'_, Vault>) -> Result<Archive> {
    state.update(None, id, revision)
}

#[tauri::command]
fn save_record(
    person_id: uuid::Uuid,
    entry: people::Record,
    revision: u64,
    state: State<'_, Vault>,
) -> Result<Archive> {
    let id = entry.id;
    state.update_record(person_id, Some(entry), id, revision)
}

#[tauri::command]
fn delete_record(
    person_id: uuid::Uuid,
    entry_id: uuid::Uuid,
    revision: u64,
    state: State<'_, Vault>,
) -> Result<Archive> {
    state.update_record(person_id, None, entry_id, revision)
}

#[tauri::command]
fn analyze(
    id: uuid::Uuid,
    year: Option<i32>,
    state: State<'_, Vault>,
) -> Result<analysis::Analysis> {
    let guard = state.session.lock().map_err(|_| Error::Locked)?;
    let session = guard.as_ref().ok_or(Error::Locked)?;
    let person = session
        .archive
        .people
        .iter()
        .find(|p| p.id == id)
        .ok_or(Error::Invalid)?;
    let today = chrono::Local::now().date_naive();
    analysis::calculate(
        person,
        year.unwrap_or_else(|| analysis::current_year(today)),
        today,
    )
}

#[tauri::command]
async fn ota_check(ota: State<'_, Arc<ota::OtaManager>>) -> Result<ota::OtaStatus> {
    let manifest = ota.check().await?;
    let current_version = ota.current_version();
    let has_update = manifest.is_some();
    let latest_version = manifest.map(|m| m.version);
    Ok(ota::OtaStatus {
        current_version,
        latest_version,
        has_update,
    })
}

#[tauri::command]
async fn ota_apply(ota: State<'_, Arc<ota::OtaManager>>) -> Result<bool> {
    if let Some(manifest) = ota.check().await? {
        ota.download_and_apply(&manifest).await?;
        Ok(true)
    } else {
        Ok(false)
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let doc_dir = app.path().document_dir()?.join("Calcolo Personale");
            let path = doc_dir.join("archivio.cpa");
            app.manage(Vault {
                path,
                session: std::sync::Mutex::new(None),
            });
            app.manage(gemini::GeminiState(std::sync::Arc::new(
                tokio::sync::Semaphore::new(1),
            )));
            let ota_manager = Arc::new(ota::OtaManager::new(doc_dir));
            app.manage(ota_manager.clone());

            let ota_resolver = ota_manager.clone();
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Calcolo Personale")
                .inner_size(1440.0, 960.0)
                .min_inner_size(360.0, 640.0)
                .maximized(true)
                .on_web_resource_request(move |req, res| {
                    let path = req.uri().path();
                    if let Some((bytes, mime)) = ota_resolver.resolve_asset(path) {
                        *res.status_mut() = http::StatusCode::OK;
                        let len = bytes.len();
                        *res.body_mut() = std::borrow::Cow::Owned(bytes);
                        res.headers_mut().insert(
                            http::header::CONTENT_TYPE,
                            http::HeaderValue::from_static(mime),
                        );
                        if let Ok(val) = http::HeaderValue::from_str(&len.to_string()) {
                            res.headers_mut().insert(http::header::CONTENT_LENGTH, val);
                        }
                    }
                })
                .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            unlock,
            lock,
            save_person,
            delete_person,
            save_record,
            delete_record,
            analyze,
            save_draft,
            directory::search_directory,
            gemini::configure_gemini,
            gemini::remove_gemini_key,
            gemini::gemini_models,
            gemini::ask_gemini,
            gemini::ollama_models,
            gemini::ask_ollama,
            ota_check,
            ota_apply,
            probability::calculate_work_probability
        ])
        .run(tauri::generate_context!())
        .expect("Application initialization failed");
}
