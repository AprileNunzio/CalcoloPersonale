use super::domain::{
    ProbabilityAnalysisResult, ProbabilityRequest, ProfileDistribution, SchoolProbability,
};
use super::dossier_stats::DossierGlobalStats;
use super::firenze::{find_institution, get_firenze_distribution, FIRENZE_BENCHMARKS};

fn calculate_percentile(score: f64, dist: &ProfileDistribution) -> f64 {
    if score <= dist.p10 {
        let ratio = (score / dist.p10).clamp(0.0, 1.0);
        return ratio * 10.0;
    }
    if score <= dist.p25 {
        let ratio = (score - dist.p10) / (dist.p25 - dist.p10);
        return 10.0 + ratio * 15.0;
    }
    if score <= dist.p50 {
        let ratio = (score - dist.p25) / (dist.p50 - dist.p25);
        return 25.0 + ratio * 25.0;
    }
    if score <= dist.p75 {
        let ratio = (score - dist.p50) / (dist.p75 - dist.p50);
        return 50.0 + ratio * 25.0;
    }
    if score <= dist.p90 {
        let ratio = (score - dist.p75) / (dist.p90 - dist.p75);
        return 75.0 + ratio * 15.0;
    }
    if score <= dist.p95 {
        let ratio = (score - dist.p90) / (dist.p95 - dist.p90);
        return 90.0 + ratio * 5.0;
    }
    let excess = score - dist.p95;
    (95.0 + excess * 0.8).clamp(95.0, 99.9)
}

fn logistic(score: f64, cutoff: f64, slope: f64) -> f64 {
    let diff = (score - cutoff) * slope;
    let clamped = diff.clamp(-12.0, 12.0);
    100.0 / (1.0 + (-clamped).exp())
}

pub fn evaluate_probability(
    req: &ProbabilityRequest,
    dossier: Option<&DossierGlobalStats>,
) -> ProbabilityAnalysisResult {
    let dist = get_firenze_distribution(&req.profile, req.fascia);
    let percentile = calculate_percentile(req.score, &dist);
    let reverse_pct = (100.0 - percentile).clamp(0.1, 100.0) / 100.0;
    let estimated_rank = ((dist.total_candidates as f64) * reverse_pct).round() as u32;
    let rank = estimated_rank.max(1).min(dist.total_candidates);

    let next_score_pct = calculate_percentile(req.score + 1.0, &dist);
    let next_reverse = (100.0 - next_score_pct).clamp(0.0, 100.0) / 100.0;
    let next_rank = ((dist.total_candidates as f64) * next_reverse).round() as u32;
    let rank_gain_per_point = rank.saturating_sub(next_rank).max(1);

    let annual_prob = logistic(req.score, dist.annual_cutoff_estimate, 0.75);
    let short_term_prob = logistic(req.score, dist.short_term_cutoff_estimate, 0.85);
    let substitute_prob = logistic(req.score, dist.substitute_cutoff_estimate, 1.05);

    let schools = evaluate_schools(req, &dist, percentile, dossier);

    let (services_count, workers_count) = match dossier {
        Some(d) => (d.total_services_analyzed, d.total_people_with_service),
        None => (0, 0),
    };

    ProbabilityAnalysisResult {
        province: req.province.clone(),
        profile: req.profile.clone(),
        fascia: req.fascia,
        user_score: req.score,
        percentile: (percentile * 10.0).round() / 10.0,
        estimated_provincial_rank: rank,
        total_provincial_candidates: dist.total_candidates,
        annual_prob: (annual_prob * 10.0).round() / 10.0,
        short_term_prob: (short_term_prob * 10.0).round() / 10.0,
        substitute_prob: (substitute_prob * 10.0).round() / 10.0,
        rank_gain_per_point,
        schools,
        retirements_total_province_current: dist.retirements_current,
        retirements_total_province_next: dist.retirements_next,
        dossier_services_count: services_count,
        dossier_distinct_workers: workers_count,
    }
}

fn evaluate_schools(
    req: &ProbabilityRequest,
    dist: &ProfileDistribution,
    user_percentile: f64,
    dossier: Option<&DossierGlobalStats>,
) -> Vec<SchoolProbability> {
    let prof = req.profile.to_uppercase();
    let mut results = Vec::new();

    let codes: Vec<String> = if req.chosen_school_codes.is_empty() {
        FIRENZE_BENCHMARKS
            .iter()
            .take(10)
            .map(|b| b.code.to_string())
            .collect()
    } else {
        req.chosen_school_codes.iter().take(30).cloned().collect()
    };

    for code in codes {
        let (name, municipality, staff, ret_curr, ret_next) =
            if let Some(bench) = find_institution(&code) {
                let (staff, ret_c, ret_n) = match prof.as_str() {
                    "AA" => (
                        bench.staff_aa,
                        bench.retirements_curr_aa,
                        bench.retirements_next_aa,
                    ),
                    "AT" => (
                        bench.staff_at,
                        bench.retirements_curr_at,
                        bench.retirements_next_at,
                    ),
                    _ => (
                        bench.staff_cs,
                        bench.retirements_curr_cs,
                        bench.retirements_next_cs,
                    ),
                };
                (
                    bench.name.to_string(),
                    bench.municipality.to_string(),
                    staff,
                    ret_c,
                    ret_n,
                )
            } else {
                let default_staff = match prof.as_str() {
                    "AA" => 8,
                    "AT" => 4,
                    _ => 20,
                };
                (
                    code.clone(),
                    "FIRENZE".to_string(),
                    default_staff,
                    1,
                    1,
                )
            };

        let school_candidates = match req.fascia {
            1 => (dist.total_candidates / 40).clamp(15, 60),
            _ => match prof.as_str() {
                "AA" => 190,
                "AT" => 75,
                _ => 280,
            },
        };

        let reverse_pct = (100.0 - user_percentile).clamp(0.2, 100.0) / 100.0;
        let estimated_school_rank = ((school_candidates as f64) * reverse_pct).round() as u32;
        let rank = estimated_school_rank.max(1);

        let (d_assignments, d_days) = match dossier.and_then(|d| d.school_stats.get(&code)) {
            Some(s) => (s.recorded_assignments, s.total_days_worked),
            None => (0, 0),
        };

        let retirement_boost = ((ret_curr + ret_next) as f64) * 3.5;
        let empirical_boost = (d_assignments as f64 * 1.5).clamp(0.0, 5.0);

        let base_annual = logistic(req.score, dist.annual_cutoff_estimate, 0.75);
        let base_short = logistic(req.score, dist.short_term_cutoff_estimate, 0.85);
        let base_sub = logistic(req.score, dist.substitute_cutoff_estimate, 1.05);

        let school_annual = (base_annual + retirement_boost).clamp(0.0, 99.0);
        let school_short = (base_short + retirement_boost * 1.5 + empirical_boost * 0.5).clamp(0.0, 99.5);
        let school_sub = (base_sub + retirement_boost * 2.0 + empirical_boost).clamp(0.0, 99.9);

        let opportunity_index = ((staff as f64 * 1.5
            + (ret_curr + ret_next) as f64 * 8.0
            + empirical_boost * 3.0
            + (100.0 - (rank as f64 / school_candidates as f64 * 100.0)))
            / 2.0)
            .clamp(1.0, 99.9);

        results.push(SchoolProbability {
            code,
            name,
            municipality,
            annual_assignment_prob: (school_annual * 10.0).round() / 10.0,
            short_term_assignment_prob: (school_short * 10.0).round() / 10.0,
            substitute_call_prob: (school_sub * 10.0).round() / 10.0,
            estimated_school_rank: rank,
            total_candidates: school_candidates,
            retirements_current_year: ret_curr,
            retirements_next_year: ret_next,
            total_staff_positions: staff,
            opportunity_index: (opportunity_index * 10.0).round() / 10.0,
            dossier_assignments: d_assignments,
            dossier_days_worked: d_days,
        });
    }

    results.sort_by(|a, b| {
        b.opportunity_index
            .partial_cmp(&a.opportunity_index)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    results
}
