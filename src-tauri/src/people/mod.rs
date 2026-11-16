use crate::shared::{Error, Result};
use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Person {
    pub id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub gender: String,
    pub birth_date: Option<NaiveDate>,
    pub fiscal_code: String,
    #[serde(default)]
    pub birth_place: Option<String>,
    #[serde(default)]
    pub birth_province: Option<String>,
    #[serde(default)]
    pub profile: String,
    #[serde(default)]
    pub municipality: Option<crate::directory::DirectoryEntry>,
    pub records: Vec<Record>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Record {
    pub id: Uuid,
    pub kind: String,
    pub title: String,
    pub start: NaiveDate,
    pub end: Option<NaiveDate>,
    pub amount: Option<f64>,
    pub notes: String,
    #[serde(default)]
    pub profile: Option<String>,
    #[serde(default)]
    pub school: Option<crate::directory::DirectoryEntry>,
}

pub fn text_valid(value: &str, max: usize) -> bool {
    value.chars().count() <= max && !value.chars().any(|c| c.is_control())
}

impl Person {
    pub fn validate(&self) -> Result<()> {
        if self.first_name.trim().is_empty()
            || self.last_name.trim().is_empty()
            || !text_valid(&self.first_name, 80)
            || !text_valid(&self.last_name, 80)
            || !["female", "male", "other"].contains(&self.gender.as_str())
            || (!self.profile.is_empty()
                && !["AA", "AT", "CS", "CO", "IF", "GA", "OS"].contains(&self.profile.as_str()))
            || self
                .birth_place
                .as_deref()
                .is_some_and(|p| !text_valid(p, 100))
            || self
                .birth_province
                .as_deref()
                .is_some_and(|p| !text_valid(p, 10))
            || (!self.fiscal_code.is_empty()
                && (self.fiscal_code.len() != 16
                    || !self
                        .fiscal_code
                        .bytes()
                        .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())))
            || self.birth_date.is_some_and(|d| d > Utc::now().date_naive())
            || self.records.len() > 10000
        {
            return Err(Error::Invalid);
        }
        let mut ids = std::collections::HashSet::new();
        for record in &self.records {
            if !ids.insert(record.id)
                || ![
                    "service",
                    "qualification",
                    "child",
                    "sickness",
                    "parental",
                    "holiday",
                    "festivity",
                    "bereavement",
                    "blood",
                    "other",
                ]
                .contains(&record.kind.as_str())
                || record.title.trim().is_empty()
                || !text_valid(&record.title, 160)
                || !text_valid(&record.notes, 2000)
                || record
                    .profile
                    .as_deref()
                    .is_some_and(|p| !["AA", "AT", "CS", "CO", "IF", "GA", "OS"].contains(&p))
                || record.end.is_some_and(|d| d < record.start)
                || record
                    .amount
                    .is_some_and(|n| !n.is_finite() || !(0.0..=100000.0).contains(&n))
                || (record.kind == "child" && record.start > Utc::now().date_naive())
            {
                return Err(Error::Invalid);
            }
        }
        Ok(())
    }
}
