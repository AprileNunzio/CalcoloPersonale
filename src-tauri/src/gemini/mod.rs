use crate::{
    shared::{Error, Result},
    vault::Vault,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tauri::State;
use zeroize::Zeroizing;

pub struct GeminiState(pub Arc<tokio::sync::Semaphore>);

#[derive(Clone, Serialize, Deserialize)]
pub struct ImagePayload {
    pub mime_type: String,
    pub data: String,
}

fn require_unlock(vault: &Vault) -> Result<()> {
    if vault.session.lock().map_err(|_| Error::Locked)?.is_none() {
        return Err(Error::Locked);
    }
    Ok(())
}

#[cfg(windows)]
fn credential() -> Result<keyring::Entry> {
    keyring::Entry::new("it.nunziotech.calcolopersonale", "gemini-api-key")
        .map_err(|_| Error::Credential)
}

#[cfg(windows)]
fn api_key() -> Result<Zeroizing<String>> {
    credential()?
        .get_password()
        .map(Zeroizing::new)
        .map_err(|_| Error::Credential)
}

#[cfg(not(windows))]
fn api_key() -> Result<Zeroizing<String>> {
    Err(Error::Credential)
}

#[tauri::command]
pub fn configure_gemini(key: String, vault: State<'_, Vault>) -> Result<()> {
    require_unlock(&vault)?;
    let key = Zeroizing::new(key);
    if key.len() < 20
        || key.len() > 256
        || !key
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err(Error::Invalid);
    }
    #[cfg(windows)]
    {
        credential()?
            .set_password(&key)
            .map_err(|_| Error::Credential)
    }
    #[cfg(not(windows))]
    {
        Err(Error::Credential)
    }
}

#[tauri::command]
pub fn remove_gemini_key(vault: State<'_, Vault>) -> Result<()> {
    require_unlock(&vault)?;
    #[cfg(windows)]
    {
        credential()?
            .delete_credential()
            .map_err(|_| Error::Credential)
    }
    #[cfg(not(windows))]
    {
        Err(Error::Credential)
    }
}

async fn response_json(mut response: reqwest::Response) -> Result<Value> {
    if !response.status().is_success() {
        return Err(Error::Remote);
    }
    let mut body = Zeroizing::new(Vec::new());
    while let Some(chunk) = response.chunk().await.map_err(|_| Error::Remote)? {
        if body.len() + chunk.len() > 2_000_000 {
            return Err(Error::Remote);
        }
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).map_err(|_| Error::Remote)
}

#[tauri::command]
pub async fn gemini_models(vault: State<'_, Vault>) -> Result<Vec<String>> {
    require_unlock(&vault)?;
    let key = api_key()?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(25))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| Error::Remote)?;
    let response = client
        .get("https://generativelanguage.googleapis.com/v1beta/models")
        .header("x-goog-api-key", key.as_str())
        .send()
        .await
        .map_err(|_| Error::Remote)?;
    let body = response_json(response).await?;
    let models = body["models"].as_array().ok_or(Error::Remote)?;
    Ok(models
        .iter()
        .filter(|model| {
            model["supportedGenerationMethods"]
                .as_array()
                .is_some_and(|methods| methods.iter().any(|method| method == "generateContent"))
        })
        .filter_map(|model| {
            model["name"]
                .as_str()
                .and_then(|name| name.strip_prefix("models/"))
                .map(str::to_string)
        })
        .collect())
}

#[tauri::command]
pub async fn ask_gemini(
    prompt: String,
    model: String,
    consent: bool,
    images: Option<Vec<ImagePayload>>,
    vault: State<'_, Vault>,
    state: State<'_, GeminiState>,
) -> Result<String> {
    require_unlock(&vault)?;
    if !consent
        || prompt.trim().is_empty()
        || prompt.len() > 64000
        || model.is_empty()
        || model.len() > 100
        || !model
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'.' || b == b'_')
    {
        return Err(Error::Invalid);
    }
    let _permit = state
        .0
        .clone()
        .try_acquire_owned()
        .map_err(|_| Error::Busy)?;
    let key = api_key()?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| Error::Remote)?;
    let mut parts: Vec<Value> = vec![json!({"text": prompt})];
    if let Some(imgs) = images {
        for img in imgs {
            if !img.data.is_empty() && img.data.len() <= 20_000_000 {
                parts.push(json!({
                    "inline_data": {
                        "mime_type": img.mime_type,
                        "data": img.data
                    }
                }));
            }
        }
    }
    let response = client
        .post(format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        ))
        .header("x-goog-api-key", key.as_str())
        .json(&json!({
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"maxOutputTokens": 8192}
        }))
        .send()
        .await
        .map_err(|_| Error::Remote)?;
    let body = response_json(response).await?;
    let parts = body["candidates"][0]["content"]["parts"]
        .as_array()
        .ok_or(Error::Remote)?;
    let answer = parts
        .iter()
        .filter_map(|part| part["text"].as_str())
        .collect::<Vec<_>>()
        .join("\n");
    if answer.is_empty() {
        return Err(Error::Remote);
    }
    Ok(answer)
}

fn get_ollama_candidates(endpoint: Option<String>) -> Result<Vec<String>> {
    let url = endpoint.unwrap_or_else(|| "http://127.0.0.1:11434".into());
    let url = url.trim_end_matches('/').to_string();
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(Error::Invalid);
    }
    let mut candidates = vec![url.clone()];
    if url.contains("127.0.0.1") {
        candidates.push(url.replace("127.0.0.1", "localhost"));
    } else if url.contains("localhost") {
        candidates.push(url.replace("localhost", "127.0.0.1"));
    }
    Ok(candidates)
}

#[tauri::command]
pub async fn ollama_models(
    endpoint: Option<String>,
    vault: State<'_, Vault>,
) -> Result<Vec<String>> {
    require_unlock(&vault)?;
    let candidates = get_ollama_candidates(endpoint)?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|_| Error::Remote)?;

    let mut last_err = Error::Remote;
    for url in candidates {
        let response = match client.get(format!("{url}/api/tags")).send().await {
            Ok(r) => r,
            Err(_) => {
                last_err = Error::Remote;
                continue;
            }
        };
        let body = match response_json(response).await {
            Ok(b) => b,
            Err(e) => {
                last_err = e;
                continue;
            }
        };
        if let Some(models) = body["models"].as_array() {
            let list: Vec<String> = models
                .iter()
                .filter_map(|m| {
                    m["name"]
                        .as_str()
                        .or_else(|| m["model"].as_str())
                        .map(str::to_string)
                })
                .collect();
            return Ok(list);
        }
    }
    Err(last_err)
}

#[tauri::command]
pub async fn ask_ollama(
    endpoint: Option<String>,
    model: String,
    prompt: String,
    images: Option<Vec<String>>,
    vault: State<'_, Vault>,
    state: State<'_, GeminiState>,
) -> Result<String> {
    require_unlock(&vault)?;
    if prompt.trim().is_empty() || model.is_empty() || model.len() > 100 {
        return Err(Error::Invalid);
    }
    let _permit = state
        .0
        .clone()
        .try_acquire_owned()
        .map_err(|_| Error::Busy)?;
    let candidates = get_ollama_candidates(endpoint)?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(180))
        .build()
        .map_err(|_| Error::Remote)?;
    let mut payload = json!({
        "model": model,
        "prompt": prompt,
        "stream": false
    });
    if let Some(imgs) = images {
        if !imgs.is_empty() {
            payload["images"] = json!(imgs);
        }
    }

    let mut last_err = Error::Remote;
    for url in candidates {
        let response = match client
            .post(format!("{url}/api/generate"))
            .json(&payload)
            .send()
            .await
        {
            Ok(r) => r,
            Err(_) => {
                last_err = Error::Remote;
                continue;
            }
        };
        let body = match response_json(response).await {
            Ok(b) => b,
            Err(e) => {
                last_err = e;
                continue;
            }
        };
        if let Some(answer) = body["response"].as_str() {
            if !answer.is_empty() {
                return Ok(answer.to_string());
            }
        }
    }
    Err(last_err)
}
