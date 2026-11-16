use crate::{
    people::Person,
    shared::{Error, Result},
};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::Argon2;
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::Mutex,
};
use zeroize::Zeroizing;

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Archive {
    pub revision: u64,
    pub people: Vec<Person>,
    #[serde(default)]
    pub drafts: std::collections::BTreeMap<String, serde_json::Value>,
}

pub struct Session {
    key: Zeroizing<[u8; 32]>,
    salt: [u8; 16],
    pub archive: Archive,
}

pub struct Vault {
    pub path: PathBuf,
    pub session: Mutex<Option<Session>>,
}

impl Vault {
    pub fn save_draft(&self, key: String, value: serde_json::Value) -> Result<Archive> {
        if key.len() > 120 || serde_json::to_vec(&value)?.len() > 262144 {
            return Err(Error::Invalid);
        }
        let mut guard = self.session.lock().map_err(|_| Error::Locked)?;
        let session = guard.as_mut().ok_or(Error::Locked)?;
        let mut next = session.archive.clone();
        if next.drafts.len() >= 10000 && !next.drafts.contains_key(&key) {
            return Err(Error::Invalid);
        }
        if let Some(id) = key.strip_prefix("person:") {
            let id = uuid::Uuid::parse_str(id).map_err(|_| Error::Invalid)?;
            if let Ok(mut person) = serde_json::from_value::<Person>(value.clone()) {
                if person.id != id {
                    return Err(Error::Invalid);
                }
                if let Some(existing) = next.people.iter().find(|p| p.id == id) {
                    person.records = existing.records.clone();
                }
                if person.validate().is_ok() {
                    next.people.retain(|p| p.id != id);
                    next.people.push(person);
                }
            }
        } else if let Some(id) = key.strip_prefix("entry:") {
            let (id, section) = id.split_once(':').ok_or(Error::Invalid)?;
            if !["service", "qualification", "child", "absences"].contains(&section) {
                return Err(Error::Invalid);
            }
            let id = uuid::Uuid::parse_str(id).map_err(|_| Error::Invalid)?;
            let person = next
                .people
                .iter_mut()
                .find(|p| p.id == id)
                .ok_or(Error::Invalid)?;
            if let Ok(entry) = serde_json::from_value::<crate::people::Record>(value.clone()) {
                if (section == "absences"
                    && ["service", "qualification", "child"].contains(&entry.kind.as_str()))
                    || (section != "absences" && entry.kind != section)
                {
                    return Err(Error::Invalid);
                }
                let mut candidate = person.clone();
                candidate.records.retain(|r| r.id != entry.id);
                candidate.records.push(entry);
                if candidate.validate().is_ok() {
                    *person = candidate;
                }
            }
        } else if key == "assistant" {
            if !value.is_null() {
                let object = value.as_object().ok_or(Error::Invalid)?;
                if object.len() != 3
                    || !["model", "prompt", "answer"].iter().all(|field| {
                        object.get(*field).is_some_and(|value| {
                            value.as_str().is_some_and(|text| text.len() <= 100000)
                        })
                    })
                {
                    return Err(Error::Invalid);
                }
            }
        } else {
            return Err(Error::Invalid);
        }
        if value.is_null() {
            next.drafts.remove(&key);
        } else {
            next.drafts.insert(key, value);
        }
        next.revision += 1;
        self.persist(session, &next)?;
        session.archive = next.clone();
        Ok(next)
    }
    pub fn unlock(&self, password: Zeroizing<String>) -> Result<Archive> {
        let mut guard = self.session.lock().map_err(|_| Error::Locked)?;
        if let Some(ref session) = *guard {
            return Ok(session.archive.clone());
        }
        if password.len() < 12 || password.len() > 1024 {
            return Err(Error::Invalid);
        }
        fs::create_dir_all(self.path.parent().ok_or(Error::Invalid)?)?;
        let existing = match fs::read(&self.path) {
            Ok(bytes) => Some(bytes),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e.into()),
        };
        let mut salt = [0u8; 16];
        if let Some(ref data) = existing {
            if data.len() < 48 || &data[..4] != b"CPA1" {
                return Err(Error::Crypto);
            }
            salt.copy_from_slice(&data[4..20]);
        } else {
            OsRng.fill_bytes(&mut salt);
        }
        let mut key = Zeroizing::new([0u8; 32]);
        Argon2::default()
            .hash_password_into(password.as_bytes(), &salt, key.as_mut())
            .map_err(|_| Error::Crypto)?;
        let archive = if let Some(data) = existing {
            let cipher = Aes256Gcm::new_from_slice(key.as_ref()).map_err(|_| Error::Crypto)?;
            let plain = Zeroizing::new(
                cipher
                    .decrypt(Nonce::from_slice(&data[20..32]), &data[32..])
                    .map_err(|_| Error::Crypto)?,
            );
            let archive: Archive = serde_json::from_slice(&plain)?;
            for person in &archive.people {
                person.validate()?;
            }
            archive
        } else {
            Archive::default()
        };
        let session = Session {
            key,
            salt,
            archive: archive.clone(),
        };
        if !self.path.exists() {
            self.persist(&session, &archive)?;
        }
        *guard = Some(session);
        Ok(archive)
    }

    fn persist(&self, session: &Session, archive: &Archive) -> Result<()> {
        let plain = Zeroizing::new(serde_json::to_vec(archive)?);
        let mut nonce = [0u8; 12];
        OsRng.fill_bytes(&mut nonce);
        let cipher = Aes256Gcm::new_from_slice(session.key.as_ref()).map_err(|_| Error::Crypto)?;
        let encrypted = cipher
            .encrypt(Nonce::from_slice(&nonce), plain.as_slice())
            .map_err(|_| Error::Crypto)?;
        let temporary = self.path.with_extension("pending");
        let mut file = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&temporary)?;
        file.write_all(b"CPA1")?;
        file.write_all(&session.salt)?;
        file.write_all(&nonce)?;
        file.write_all(&encrypted)?;
        file.sync_all()?;
        drop(file);
        replace(&temporary, &self.path)?;
        Ok(())
    }

    pub fn update(&self, person: Option<Person>, id: uuid::Uuid, revision: u64) -> Result<Archive> {
        let mut guard = self.session.lock().map_err(|_| Error::Locked)?;
        let session = guard.as_mut().ok_or(Error::Locked)?;
        if session.archive.revision != revision {
            return Err(Error::Conflict);
        }
        let mut next = session.archive.clone();
        let existing = next.people.iter().find(|p| p.id == id).cloned();
        next.people.retain(|p| p.id != id);
        next.drafts.remove(&format!("person:{id}"));
        if let Some(mut person) = person {
            if let Some(existing) = existing {
                person.records = existing.records;
            }
            person.validate()?;
            if next.people.len() >= 10000 {
                return Err(Error::Invalid);
            }
            next.people.push(person);
        } else {
            let prefix = format!("entry:{id}");
            next.drafts
                .retain(|key, _| key != &prefix && !key.starts_with(&format!("{prefix}:")));
        }
        next.revision += 1;
        self.persist(session, &next)?;
        session.archive = next.clone();
        Ok(next)
    }

    pub fn update_record(
        &self,
        person_id: uuid::Uuid,
        entry: Option<crate::people::Record>,
        entry_id: uuid::Uuid,
        revision: u64,
    ) -> Result<Archive> {
        let mut guard = self.session.lock().map_err(|_| Error::Locked)?;
        let session = guard.as_mut().ok_or(Error::Locked)?;
        if session.archive.revision != revision {
            return Err(Error::Conflict);
        }
        let mut next = session.archive.clone();
        let person = next
            .people
            .iter_mut()
            .find(|p| p.id == person_id)
            .ok_or(Error::Invalid)?;
        person.records.retain(|record| record.id != entry_id);
        if let Some(record) = entry {
            person.records.push(record);
        }
        person.validate()?;
        let prefix = format!("entry:{person_id}:");
        next.drafts.retain(|key, value| {
            !key.starts_with(&prefix)
                || value.get("id").and_then(|v| v.as_str()) != Some(entry_id.to_string().as_str())
        });
        next.revision += 1;
        self.persist(session, &next)?;
        session.archive = next.clone();
        Ok(next)
    }
}

#[cfg(test)]
mod tests;

#[cfg(windows)]
fn replace(from: &std::path::Path, to: &std::path::Path) -> std::io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    let from: Vec<u16> = from.as_os_str().encode_wide().chain(Some(0)).collect();
    let to: Vec<u16> = to.as_os_str().encode_wide().chain(Some(0)).collect();
    let result = unsafe {
        windows_sys::Win32::Storage::FileSystem::MoveFileExW(from.as_ptr(), to.as_ptr(), 0x1 | 0x8)
    };
    if result == 0 {
        Err(std::io::Error::last_os_error())
    } else {
        Ok(())
    }
}

#[cfg(not(windows))]
fn replace(from: &std::path::Path, to: &std::path::Path) -> std::io::Result<()> {
    fs::rename(from, to)
}
