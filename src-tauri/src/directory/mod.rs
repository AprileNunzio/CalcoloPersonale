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
    #[serde(default)]
    pub details: std::collections::BTreeMap<String, String>,
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
    let mut scored: Vec<(u8, &DirectoryEntry)> = directory
        .entries
        .iter()
        .filter_map(|e| {
            let code_up = e.code.to_uppercase();
            let name_up = e.name.to_uppercase();
            let muni_up = e.municipality.to_uppercase();
            let prov_up = e.province.to_uppercase();

            let rank = if code_up == needle {
                0
            } else if name_up == needle {
                1
            } else if muni_up == needle {
                2
            } else if code_up.starts_with(&needle) {
                3
            } else if name_up.starts_with(&needle) {
                4
            } else if muni_up.starts_with(&needle) {
                5
            } else if name_up.contains(&needle) {
                6
            } else if muni_up.contains(&needle) {
                7
            } else if prov_up == needle || prov_up.starts_with(&needle) {
                8
            } else if e
                .details
                .values()
                .any(|v| v.to_uppercase().contains(&needle))
            {
                9
            } else {
                return None;
            };
            Some((rank, e))
        })
        .collect();

    scored.sort_by(|a, b| a.0.cmp(&b.0).then_with(|| a.1.name.cmp(&b.1.name)));

    Ok(scored
        .into_iter()
        .take(50)
        .map(|(_, e)| e.clone())
        .collect())
}
