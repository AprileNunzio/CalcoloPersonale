use crate::{
    people::Person,
    shared::{Error, Result},
};
use chrono::{Datelike, NaiveDate};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Analysis {
    pub school_year: i32,
    pub service_days: usize,
    pub recorded_absence_days: usize,
    pub children: Vec<Child>,
    pub qualifications: usize,
    pub score: Option<f64>,
    pub warnings: Vec<String>,
}

#[derive(Serialize)]
pub struct Child {
    pub name: String,
    pub age: u32,
}

pub fn calculate(person: &Person, year: i32, reference: NaiveDate) -> Result<Analysis> {
    if !(1950..=2200).contains(&year) {
        return Err(Error::Invalid);
    }
    let start = NaiveDate::from_ymd_opt(year, 9, 1).ok_or(Error::Invalid)?;
    let end = NaiveDate::from_ymd_opt(year + 1, 8, 31)
        .ok_or(Error::Invalid)?
        .min(reference);
    let mut service = std::collections::HashSet::new();
    let mut absences = std::collections::HashSet::new();
    let mut children = Vec::new();
    for record in &person.records {
        if record.kind == "child" {
            if let Some(age) = reference.years_since(record.start) {
                children.push(Child {
                    name: record.title.clone(),
                    age,
                });
            }
            continue;
        }
        let target = if record.kind == "service" {
            &mut service
        } else if [
            "sickness",
            "parental",
            "holiday",
            "festivity",
            "bereavement",
            "blood",
            "other",
        ]
        .contains(&record.kind.as_str())
        {
            &mut absences
        } else {
            continue;
        };
        let last = record.end.unwrap_or(record.start).min(end);
        let first = record.start.max(start);
        if first <= last {
            for day in first.iter_days().take_while(|d| *d <= last) {
                target.insert(day);
            }
        }
    }
    Ok(Analysis {
        school_year: year,
        service_days: service.len(),
        recorded_absence_days: absences.len(),
        children,
        qualifications: person
            .records
            .iter()
            .filter(|r| r.kind == "qualification")
            .count(),
        score: None,
        warnings: vec![
            "rulesPending".into(),
            "calendarDays".into(),
            "entitlementsPending".into(),
        ],
    })
}

pub fn current_year(date: NaiveDate) -> i32 {
    date.year() - i32::from(date.month() < 9)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::people::Record;
    use uuid::Uuid;
    fn date(value: &str) -> NaiveDate {
        value.parse().unwrap()
    }
    #[test]
    fn school_year_boundary() {
        assert_eq!(current_year(date("2026-08-31")), 2025);
        assert_eq!(current_year(date("2026-09-01")), 2026);
    }
    #[test]
    fn overlap_and_future_days_are_not_counted_twice() {
        let record = Record {
            id: Uuid::new_v4(),
            kind: "service".into(),
            title: "School".into(),
            start: date("2026-08-20"),
            end: Some(date("2026-09-30")),
            amount: None,
            notes: String::new(),
            profile: Some("CS".into()),
            school: None,
        };
        let mut other = record.clone();
        other.id = Uuid::new_v4();
        let person = Person {
            id: Uuid::new_v4(),
            first_name: "A".into(),
            last_name: "B".into(),
            gender: "other".into(),
            birth_date: None,
            birth_place: None,
            birth_province: None,
            fiscal_code: String::new(),
            profile: "CS".into(),
            municipality: None,
            records: vec![record, other],
        };
        let analysis = calculate(&person, 2026, date("2026-09-10")).unwrap();
        assert_eq!(analysis.service_days, 10);
        assert!(analysis.score.is_none());
    }
}
