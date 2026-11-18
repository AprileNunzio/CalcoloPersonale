import type { Person, Entry } from '../../shared/types';

export interface PersonExportFile {
  format: 'calcolo-personale-export';
  schemaVersion: 1;
  exportedAt: string;
  appVersion: string;
  person: Person;
}

export type ResolutionChoice = 'keep_local' | 'use_imported' | 'keep_both';

export interface FieldDiff {
  field: string;
  label: string;
  localValue: string;
  importedValue: string;
  choice: 'keep_local' | 'use_imported';
}

export interface RecordFieldChange {
  field: string;
  label: string;
  local: string;
  imported: string;
}

export interface RecordDiffItem {
  id: string;
  kind: string;
  title: string;
  status: 'identical' | 'new_in_import' | 'new_in_local' | 'modified';
  localRecord?: Entry;
  importedRecord?: Entry;
  changes?: RecordFieldChange[];
  choice: ResolutionChoice;
}

export interface PersonSyncDiff {
  isExistingPerson: boolean;
  matchTarget?: Person;
  matchReason?: 'fiscal_code' | 'id';
  identityDiffs: FieldDiff[];
  recordDiffs: RecordDiffItem[];
  summary: {
    identicalRecords: number;
    newRecords: number;
    modifiedRecords: number;
    identityChanges: number;
  };
}
