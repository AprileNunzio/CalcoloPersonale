pub mod domain;
pub mod dossier_stats;
pub mod engine;
pub mod firenze;

pub use domain::{InstitutionBenchmark, ProbabilityAnalysisResult, ProbabilityRequest, SchoolProbability};

use crate::shared::{Error, Result};
use tauri::State;

#[tauri::command]
pub fn calculate_work_probability(
    request: ProbabilityRequest,
    vault: State<'_, crate::vault::Vault>,
) -> Result<ProbabilityAnalysisResult> {
    if request.score < 0.0 || request.score > 150.0 {
        return Err(Error::Invalid);
    }
    if request.fascia != 1 && request.fascia != 3 {
        return Err(Error::Invalid);
    }
    if request.chosen_school_codes.len() > 30 {
        return Err(Error::Invalid);
    }

    let dossier_stats = {
        let guard = vault.session.lock().map_err(|_| Error::Locked)?;
        guard
            .as_ref()
            .map(|s| dossier_stats::aggregate_dossier_services(&s.archive.people))
    };

    Ok(engine::evaluate_probability(
        &request,
        dossier_stats.as_ref(),
    ))
}
