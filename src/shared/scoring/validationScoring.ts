import { Person } from '../types';
import { ScoreValidationData } from './scoringTypes';

export function extractScoreValidations(person: Person): Record<string, ScoreValidationData> {
  const map: Record<string, ScoreValidationData> = {};
  const records = person.records || [];

  for (const r of records) {
    if (r.kind === 'validation' || r.kind === 'application') {
      try {
        if (r.notes && r.notes.startsWith('{')) {
          const parsed = JSON.parse(r.notes);
          if (parsed.validations && typeof parsed.validations === 'object') {
            for (const [code, val] of Object.entries(parsed.validations)) {
              if (val && typeof val === 'object') {
                map[code] = val as ScoreValidationData;
              }
            }
          }
          if (parsed.validationData && parsed.validationData.profileCode) {
            map[parsed.validationData.profileCode] = parsed.validationData;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return map;
}
