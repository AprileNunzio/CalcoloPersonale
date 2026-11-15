use crate::shared::{Error, Result};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryEntry {
    pub code: String,
    pub name: String,
    pub municipality: String,
    pub province: String,
    pub region: String,
    pub address: String,
    pub postal_code: String,
    pub email: String,
    pub pec: String,
    pub website: String,
    pub school_year: String,
    pub category: String,
}

#[derive(Deserialize)]
struct Directory {
    entries: Vec<DirectoryEntry>,
}

static SCHOOLS: OnceLock<Option<Directory>> = OnceLock::new();
static MUNICIPALITIES: OnceLock<Option<Directory>> = OnceLock::new();

#[tauri::command]
pub fn search_directory(kind: String, query: String) -> Result<Vec<DirectoryEntry>> {
    if query.len() > 160 {
        return Err(Error::Invalid);
    }
    let source = match kind.as_str() {
        "school" => SCHOOLS.get_or_init(|| {
            serde_json::from_str(include_str!("../../resources/schools.json")).ok()
        }),
        "municipality" => MUNICIPALITIES.get_or_init(|| {
            serde_json::from_str(include_str!("../../resources/municipalities.json")).ok()
        }),
        _ => return Err(Error::Invalid),
    };
    let directory = source.as_ref().ok_or(Error::Invalid)?;
    if directory.entries.is_empty() {
        return Err(Error::DirectoryUnavailable);
    }
    let needle = query.trim().to_uppercase();
    if needle.len() < 2 {
        return Ok(vec![]);
    }
    let mut found: Vec<_> = directory
        .entries
        .iter()
        .filter(|e| {
            e.code.to_uppercase().starts_with(&needle) || e.name.to_uppercase().contains(&needle)
        })
        .collect();
    found.sort_by_key(|e| (e.code.to_uppercase() != needle, e.name.to_uppercase()));
    Ok(found.into_iter().take(30).cloned().collect())
}
