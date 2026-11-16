use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("storage")]
    Storage(#[from] std::io::Error),
    #[error("invalidData")]
    Json(#[from] serde_json::Error),
    #[error("invalidData")]
    Invalid,
    #[error("locked")]
    Locked,
    #[error("unlockFailed")]
    Crypto,
    #[error("conflict")]
    Conflict,
    #[error("directoryUnavailable")]
    DirectoryUnavailable,
    #[error("credentialError")]
    Credential,
    #[error("remoteError")]
    Remote,
    #[error("requestBusy")]
    Busy,
    #[error("otaError")]
    Ota,
}

impl Serialize for Error {
    fn serialize<S: serde::Serializer>(
        &self,
        serializer: S,
    ) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}
pub type Result<T> = std::result::Result<T, Error>;
