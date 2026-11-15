use super::*;
use uuid::Uuid;

struct Fixture {
    vault: Vault,
    directory: PathBuf,
}

impl Fixture {
    fn new() -> Self {
        let directory =
            std::env::temp_dir().join(format!("calcolo-personale-test-{}", Uuid::new_v4()));
        let vault = Vault {
            path: directory.join("archive.cpa"),
            session: Mutex::new(None),
        };
        Self { vault, directory }
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        if self.directory.exists() {
            fs::remove_dir_all(&self.directory).expect("test directory cleanup");
        }
    }
}

fn person() -> Person {
    Person {
        id: Uuid::new_v4(),
        first_name: "Nome riservato".into(),
        last_name: "Test".into(),
        gender: "other".into(),
        birth_date: None,
        fiscal_code: String::new(),
        profile: "CS".into(),
        municipality: None,
        records: vec![],
    }
}

#[test]
fn encrypted_archive_reopens_and_rejects_wrong_password() {
    let fixture = Fixture::new();
    fixture
        .vault
        .unlock(Zeroizing::new("correct-password-123".into()))
        .unwrap();
    let person = person();
    fixture
        .vault
        .update(Some(person.clone()), person.id, 0)
        .unwrap();
    let bytes = fs::read(&fixture.vault.path).unwrap();
    assert!(!bytes
        .windows(person.first_name.len())
        .any(|w| w == person.first_name.as_bytes()));
    *fixture.vault.session.lock().unwrap() = None;
    assert!(matches!(
        fixture
            .vault
            .unlock(Zeroizing::new("incorrect-password".into())),
        Err(Error::Crypto)
    ));
    let restored = fixture
        .vault
        .unlock(Zeroizing::new("correct-password-123".into()))
        .unwrap();
    assert_eq!(restored.people[0].id, person.id);
    assert_eq!(restored.revision, 1);
}

#[test]
fn modified_ciphertext_is_rejected() {
    let fixture = Fixture::new();
    fixture
        .vault
        .unlock(Zeroizing::new("correct-password-123".into()))
        .unwrap();
    *fixture.vault.session.lock().unwrap() = None;
    let mut bytes = fs::read(&fixture.vault.path).unwrap();
    let last = bytes.len() - 1;
    bytes[last] ^= 1;
    fs::write(&fixture.vault.path, bytes).unwrap();
    assert!(matches!(
        fixture
            .vault
            .unlock(Zeroizing::new("correct-password-123".into())),
        Err(Error::Crypto)
    ));
}

#[test]
fn incomplete_draft_survives_without_creating_an_invalid_person() {
    let fixture = Fixture::new();
    fixture
        .vault
        .unlock(Zeroizing::new("correct-password-123".into()))
        .unwrap();
    let mut person = person();
    person.last_name.clear();
    let key = format!("person:{}", person.id);
    let archive = fixture
        .vault
        .save_draft(key.clone(), serde_json::to_value(person).unwrap())
        .unwrap();
    assert!(archive.people.is_empty());
    assert!(archive.drafts.contains_key(&key));
}

#[test]
fn stale_revision_cannot_replace_committed_data() {
    let fixture = Fixture::new();
    fixture
        .vault
        .unlock(Zeroizing::new("correct-password-123".into()))
        .unwrap();
    let person = person();
    fixture
        .vault
        .update(Some(person.clone()), person.id, 0)
        .unwrap();
    assert!(matches!(
        fixture.vault.update(None, person.id, 0),
        Err(Error::Conflict)
    ));
    assert_eq!(
        fixture
            .vault
            .session
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .archive
            .people
            .len(),
        1
    );
}
