use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbabilityRequest {
    pub province: String,
    pub profile: String,
    pub fascia: u8,
    pub score: f64,
    #[serde(default)]
    pub chosen_school_codes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchoolProbability {
    pub code: String,
    pub name: String,
    pub municipality: String,
    pub annual_assignment_prob: f64,
    pub short_term_assignment_prob: f64,
    pub substitute_call_prob: f64,
    pub estimated_school_rank: u32,
    pub total_candidates: u32,
    pub retirements_current_year: u32,
    pub retirements_next_year: u32,
    pub total_staff_positions: u32,
    pub opportunity_index: f64,
    #[serde(default)]
    pub dossier_assignments: u32,
    #[serde(default)]
    pub dossier_days_worked: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbabilityAnalysisResult {
    pub province: String,
    pub profile: String,
    pub fascia: u8,
    pub user_score: f64,
    pub percentile: f64,
    pub estimated_provincial_rank: u32,
    pub total_provincial_candidates: u32,
    pub annual_prob: f64,
    pub short_term_prob: f64,
    pub substitute_prob: f64,
    pub rank_gain_per_point: u32,
    pub schools: Vec<SchoolProbability>,
    pub retirements_total_province_current: u32,
    pub retirements_total_province_next: u32,
    #[serde(default)]
    pub dossier_services_count: u32,
    #[serde(default)]
    pub dossier_distinct_workers: u32,
}

#[derive(Debug, Clone, Copy)]
pub struct ProfileDistribution {
    pub total_candidates: u32,
    pub annual_vacancies: u32,
    pub short_term_vacancies: u32,
    pub substitute_flow: u32,
    pub retirements_current: u32,
    pub retirements_next: u32,
    pub p10: f64,
    pub p25: f64,
    pub p50: f64,
    pub p75: f64,
    pub p90: f64,
    pub p95: f64,
    pub annual_cutoff_estimate: f64,
    pub short_term_cutoff_estimate: f64,
    pub substitute_cutoff_estimate: f64,
}

#[derive(Debug, Clone)]
pub struct InstitutionBenchmark {
    pub code: &'static str,
    pub name: &'static str,
    pub municipality: &'static str,
    pub staff_cs: u32,
    pub staff_aa: u32,
    pub staff_at: u32,
    pub retirements_curr_cs: u32,
    pub retirements_next_cs: u32,
    pub retirements_curr_aa: u32,
    pub retirements_next_aa: u32,
    pub retirements_curr_at: u32,
    pub retirements_next_at: u32,
}
