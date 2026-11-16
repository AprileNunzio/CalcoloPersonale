use crate::shared::{Error, Result};
use flate2::read::GzDecoder;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::{Cursor, Write},
    path::{Component, PathBuf},
};
use tar::Archive;

const MANIFEST_URL: &str =
    "https://raw.githubusercontent.com/AprileNunzio/CalcoloPersonale/main/ota-manifest.json";

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OtaManifest {
    pub version: String,
    pub commit: String,
    pub sha256: String,
    pub url: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OtaStatus {
    pub current_version: String,
    pub latest_version: Option<String>,
    pub has_update: bool,
}

pub struct OtaManager {
    base_dir: PathBuf,
    client: Client,
}

impl OtaManager {
    pub fn new(root_dir: PathBuf) -> Self {
        let base_dir = root_dir.join("ota");
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .user_agent("CalcoloPersonale/0.1.3")
            .build()
            .unwrap_or_default();
        Self { base_dir, client }
    }

    pub fn current_version(&self) -> String {
        let marker = self.base_dir.join("current_version.txt");
        if marker.exists() {
            fs::read_to_string(marker)
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|_| env!("CARGO_PKG_VERSION").into())
        } else {
            env!("CARGO_PKG_VERSION").into()
        }
    }

    pub fn active_dist_path(&self) -> Option<PathBuf> {
        let ver = self.current_version();
        if ver == "embedded" {
            return None;
        }
        let target = self.base_dir.join("versions").join(&ver);
        if target.join("index.html").exists() {
            Some(target)
        } else {
            None
        }
    }

    pub async fn check(&self) -> Result<Option<OtaManifest>> {
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        let url = format!("{}?t={}", MANIFEST_URL, ts);
        let response = self
            .client
            .get(&url)
            .header("Cache-Control", "no-cache")
            .header("Pragma", "no-cache")
            .send()
            .await
            .map_err(|_| Error::Remote)?;

        if !response.status().is_success() {
            return Ok(None);
        }

        let manifest: OtaManifest = response.json().await.map_err(|_| Error::Ota)?;
        let current = self.current_version();

        if manifest.version != current && manifest.commit != current {
            Ok(Some(manifest))
        } else {
            Ok(None)
        }
    }

    pub async fn download_and_apply(&self, manifest: &OtaManifest) -> Result<()> {
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        let url = format!("{}?t={}", manifest.url, ts);
        let bytes = self
            .client
            .get(&url)
            .header("Cache-Control", "no-cache")
            .header("Pragma", "no-cache")
            .send()
            .await
            .map_err(|_| Error::Remote)?
            .bytes()
            .await
            .map_err(|_| Error::Remote)?;

        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let calculated = format!("{:x}", hasher.finalize());

        if calculated.to_lowercase() != manifest.sha256.to_lowercase() {
            return Err(Error::Ota);
        }

        let destination = self.base_dir.join("versions").join(&manifest.version);
        if destination.exists() {
            fs::remove_dir_all(&destination)
                .map_err(|_| Error::Storage(std::io::Error::last_os_error()))?;
        }
        fs::create_dir_all(&destination).map_err(Error::Storage)?;

        let tar_stream = GzDecoder::new(Cursor::new(bytes));
        let mut archive = Archive::new(tar_stream);

        for entry in archive.entries().map_err(|_| Error::Ota)? {
            let mut entry = entry.map_err(|_| Error::Ota)?;
            let path = entry.path().map_err(|_| Error::Ota)?.into_owned();
            if path.components().any(|c| {
                matches!(
                    c,
                    Component::ParentDir | Component::RootDir | Component::Prefix(_)
                )
            }) {
                return Err(Error::Ota);
            }

            let clean_path = path.strip_prefix(".").unwrap_or(&path);
            if clean_path.as_os_str().is_empty() {
                continue;
            }

            let full_path = destination.join(clean_path);
            if entry.header().entry_type().is_dir() {
                fs::create_dir_all(&full_path).map_err(Error::Storage)?;
                continue;
            }

            if let Some(parent) = full_path.parent() {
                fs::create_dir_all(parent).map_err(Error::Storage)?;
            }
            entry.unpack(&full_path).map_err(|_| Error::Ota)?;
        }

        let marker = self.base_dir.join("current_version.txt");
        let mut f = File::create(marker).map_err(Error::Storage)?;
        f.write_all(manifest.version.as_bytes())
            .map_err(Error::Storage)?;

        Ok(())
    }

    pub fn resolve_asset(&self, relative_path: &str) -> Option<(Vec<u8>, &'static str)> {
        let base = self.active_dist_path()?;
        let clean = relative_path.trim_start_matches('/');
        let path = if clean.is_empty() || clean == "index.html" {
            base.join("index.html")
        } else {
            base.join(clean)
        };

        if !path.exists() || !path.starts_with(&base) {
            return None;
        }

        let bytes = fs::read(&path).ok()?;
        let mime = if path.extension().is_some_and(|ext| ext == "js") {
            "application/javascript"
        } else if path.extension().is_some_and(|ext| ext == "css") {
            "text/css"
        } else if path.extension().is_some_and(|ext| ext == "html") {
            "text/html"
        } else if path.extension().is_some_and(|ext| ext == "svg") {
            "image/svg+xml"
        } else if path.extension().is_some_and(|ext| ext == "json") {
            "application/json"
        } else {
            "application/octet-stream"
        };

        Some((bytes, mime))
    }
}
