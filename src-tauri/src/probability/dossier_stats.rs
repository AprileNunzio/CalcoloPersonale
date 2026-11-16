use crate::people::Person;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Default, Clone)]
pub struct DossierSchoolStats {
    pub recorded_assignments: u32,
    pub total_days_worked: u64,
    pub distinct_workers: u32,
    pub annual_contracts: u32,
    pub short_term_contracts: u32,
    pub temporary_substitutes: u32,
}

#[derive(Debug, Default, Clone)]
pub struct DossierGlobalStats {
    pub total_services_analyzed: u32,
    pub total_people_with_service: u32,
    pub school_stats: BTreeMap<String, DossierSchoolStats>,
}

pub fn aggregate_dossier_services(people: &[Person]) -> DossierGlobalStats {
    let mut school_stats_map: BTreeMap<String, DossierSchoolStats> = BTreeMap::new();
    let mut school_workers_set: BTreeMap<String, BTreeSet<uuid::Uuid>> = BTreeMap::new();
    let mut total_services = 0u32;
    let mut people_with_service = 0u32;

    for person in people {
        let mut has_service = false;
        for record in &person.records {
            if record.kind != "service" {
                continue;
            }
            has_service = true;
            total_services += 1;

            let school_code = match &record.school {
                Some(s) => s.code.trim().to_uppercase(),
                None => continue,
            };
            if school_code.is_empty() {
                continue;
            }

            let days = match record.end {
                Some(end) if end >= record.start => (end - record.start).num_days() as u64 + 1,
                _ => 180u64,
            };

            let entry = school_stats_map.entry(school_code.clone()).or_default();
            entry.recorded_assignments += 1;
            entry.total_days_worked += days;

            school_workers_set
                .entry(school_code)
                .or_default()
                .insert(person.id);

            if let Some(end) = record.end {
                let month = chrono::Datelike::month(&end);
                let day = chrono::Datelike::day(&end);
                if month == 8 && day == 31 {
                    entry.annual_contracts += 1;
                } else if month == 6 && day == 30 {
                    entry.short_term_contracts += 1;
                } else {
                    entry.temporary_substitutes += 1;
                }
            } else {
                entry.annual_contracts += 1;
            }
        }

        if has_service {
            people_with_service += 1;
        }
    }

    for (code, workers) in school_workers_set {
        if let Some(stats) = school_stats_map.get_mut(&code) {
            stats.distinct_workers = workers.len() as u32;
        }
    }

    DossierGlobalStats {
        total_services_analyzed: total_services,
        total_people_with_service: people_with_service,
        school_stats: school_stats_map,
    }
}
