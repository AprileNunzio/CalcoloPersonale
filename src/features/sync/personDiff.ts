import type { Person, Entry } from '../../shared/types';
import type { DirectoryEntry } from '../directory/DirectoryPicker';
import type {
  PersonExportFile,
  PersonSyncDiff,
  FieldDiff,
  RecordDiffItem,
  RecordFieldChange,
  ResolutionChoice,
} from './exportImportTypes';

export function normalizeDirectoryEntry(entry: any, defaultKind = 'SCUANAGRAFE'): DirectoryEntry {
  if (typeof entry === 'string') {
    return {
      code: '',
      name: entry,
      municipality: entry,
      province: '',
      region: '',
      address: '',
      postalCode: '',
      email: '',
      pec: '',
      website: '',
      schoolYear: '',
      category: defaultKind,
      details: {},
    };
  }
  return {
    code: entry?.code || '',
    name: entry?.name || '',
    municipality: entry?.municipality || '',
    province: entry?.province || '',
    region: entry?.region || '',
    address: entry?.address || '',
    postalCode: entry?.postalCode || '',
    email: entry?.email || '',
    pec: entry?.pec || '',
    website: entry?.website || '',
    schoolYear: entry?.schoolYear || '',
    category: entry?.category || defaultKind,
    details: entry?.details || {},
  };
}

export function normalizePerson(person: any): Person {
  if (!person) return person;
  if (person.municipality) {
    person.municipality = normalizeDirectoryEntry(person.municipality, 'municipality');
  } else {
    person.municipality = null;
  }
  if (Array.isArray(person.records)) {
    for (const r of person.records) {
      if (r.school) {
        r.school = normalizeDirectoryEntry(r.school, 'SCUANAGRAFE');
      } else {
        r.school = null;
      }
    }
  } else {
    person.records = [];
  }
  return person as Person;
}

export function parsePersonExportFile(raw: string): { ok: true; person: Person } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    let person: Person | null = null;
    if (parsed && typeof parsed === 'object') {
      if (parsed.format === 'calcolo-personale-export' && parsed.person) {
        person = parsed.person as Person;
      } else if (parsed.fiscalCode || parsed.lastName) {
        person = parsed as Person;
      }
    }
    if (!person || !person.lastName || (!person.fiscalCode && !person.id)) {
      return { ok: false, error: 'Il file selezionato non contiene un profilo persona valido di Calcolo Personale.' };
    }
    person = normalizePerson(person);
    return { ok: true, person };
  } catch (err) {
    return { ok: false, error: 'Errore di lettura del file: sintassi JSON non valida.' };
  }
}

export function calculatePersonDiff(imported: Person, people: Person[]): PersonSyncDiff {
  const cleanImportedCf = (imported.fiscalCode || '').trim().toUpperCase();
  const matchTarget = people.find(p => {
    const cf = (p.fiscalCode || '').trim().toUpperCase();
    if (cleanImportedCf && cf && cf === cleanImportedCf) return true;
    return p.id === imported.id;
  });

  if (!matchTarget) {
    const recordDiffs: RecordDiffItem[] = (imported.records || []).map(r => ({
      id: r.id,
      kind: r.kind,
      title: r.title || 'Nuovo elemento',
      status: 'new_in_import',
      importedRecord: r,
      choice: 'use_imported',
    }));

    return {
      isExistingPerson: false,
      identityDiffs: [],
      recordDiffs,
      summary: {
        identicalRecords: 0,
        newRecords: recordDiffs.length,
        modifiedRecords: 0,
        identityChanges: 0,
      },
    };
  }

  const matchReason = cleanImportedCf && (matchTarget.fiscalCode || '').trim().toUpperCase() === cleanImportedCf
    ? 'fiscal_code'
    : 'id';

  const identityFields: { field: keyof Person; label: string }[] = [
    { field: 'lastName', label: 'Cognome' },
    { field: 'firstName', label: 'Nome' },
    { field: 'gender', label: 'Genere' },
    { field: 'birthDate', label: 'Data di Nascita' },
    { field: 'birthPlace', label: 'Luogo di Nascita' },
    { field: 'birthProvince', label: 'Provincia di Nascita' },
    { field: 'fiscalCode', label: 'Codice Fiscale' },
    { field: 'profile', label: 'Profilo Contrattuale' },
  ];

  const identityDiffs: FieldDiff[] = [];
  for (const item of identityFields) {
    const localVal = String(matchTarget[item.field] ?? '').trim();
    const importVal = String(imported[item.field] ?? '').trim();
    if (localVal !== importVal && (localVal || importVal)) {
      identityDiffs.push({
        field: item.field,
        label: item.label,
        localValue: localVal || '—',
        importedValue: importVal || '—',
        choice: 'use_imported',
      });
    }
  }

  const localMun = matchTarget.municipality?.name || '';
  const importMun = imported.municipality?.name || '';
  if (localMun !== importMun && (localMun || importMun)) {
    identityDiffs.push({
      field: 'municipality',
      label: 'Comune di Residenza',
      localValue: localMun || '—',
      importedValue: importMun || '—',
      choice: 'use_imported',
    });
  }

  const localRecords = [...(matchTarget.records || [])];
  const importedRecords = [...(imported.records || [])];
  const matchedLocalIds = new Set<string>();
  const recordDiffs: RecordDiffItem[] = [];

  const getCompositeKey = (r: Entry) =>
    `${r.kind}|${r.start || ''}|${(r.title || '').trim().toLowerCase()}|${r.school?.code || ''}`;

  for (const imp of importedRecords) {
    let localMatch = localRecords.find(l => l.id === imp.id);
    if (!localMatch) {
      const impKey = getCompositeKey(imp);
      localMatch = localRecords.find(l => !matchedLocalIds.has(l.id) && getCompositeKey(l) === impKey);
    }

    if (localMatch) {
      matchedLocalIds.add(localMatch.id);
      const changes: RecordFieldChange[] = [];

      if ((localMatch.title || '').trim() !== (imp.title || '').trim()) {
        changes.push({ field: 'title', label: 'Descrizione / Scuola', local: localMatch.title, imported: imp.title });
      }
      if ((localMatch.start || '') !== (imp.start || '')) {
        changes.push({ field: 'start', label: 'Data Inizio', local: localMatch.start || '—', imported: imp.start || '—' });
      }
      if ((localMatch.end || '') !== (imp.end || '')) {
        changes.push({ field: 'end', label: 'Data Fine', local: localMatch.end || '—', imported: imp.end || '—' });
      }
      if ((localMatch.profile || '') !== (imp.profile || '')) {
        changes.push({ field: 'profile', label: 'Profilo', local: localMatch.profile || '—', imported: imp.profile || '—' });
      }
      if ((localMatch.school?.code || '') !== (imp.school?.code || '')) {
        changes.push({
          field: 'school',
          label: 'Codice Meccanografico',
          local: localMatch.school?.code || '—',
          imported: imp.school?.code || '—',
        });
      }
      if (localMatch.amount !== imp.amount) {
        changes.push({
          field: 'amount',
          label: 'Ore / Importo',
          local: localMatch.amount !== null ? String(localMatch.amount) : '—',
          imported: imp.amount !== null ? String(imp.amount) : '—',
        });
      }
      if ((localMatch.notes || '').trim() !== (imp.notes || '').trim()) {
        changes.push({ field: 'notes', label: 'Note', local: localMatch.notes || '—', imported: imp.notes || '—' });
      }

      if (changes.length > 0) {
        recordDiffs.push({
          id: imp.id || localMatch.id,
          kind: imp.kind,
          title: imp.title || localMatch.title || 'Record modificato',
          status: 'modified',
          localRecord: localMatch,
          importedRecord: imp,
          changes,
          choice: 'use_imported',
        });
      } else {
        recordDiffs.push({
          id: imp.id || localMatch.id,
          kind: imp.kind,
          title: imp.title || localMatch.title || 'Record identico',
          status: 'identical',
          localRecord: localMatch,
          importedRecord: imp,
          choice: 'keep_local',
        });
      }
    } else {
      recordDiffs.push({
        id: imp.id,
        kind: imp.kind,
        title: imp.title || 'Nuovo record importato',
        status: 'new_in_import',
        importedRecord: imp,
        choice: 'use_imported',
      });
    }
  }

  for (const loc of localRecords) {
    if (!matchedLocalIds.has(loc.id)) {
      recordDiffs.push({
        id: loc.id,
        kind: loc.kind,
        title: loc.title || 'Record presente solo in locale',
        status: 'new_in_local',
        localRecord: loc,
        choice: 'keep_local',
      });
    }
  }

  return {
    isExistingPerson: true,
    matchTarget,
    matchReason,
    identityDiffs,
    recordDiffs,
    summary: {
      identicalRecords: recordDiffs.filter(r => r.status === 'identical').length,
      newRecords: recordDiffs.filter(r => r.status === 'new_in_import').length,
      modifiedRecords: recordDiffs.filter(r => r.status === 'modified').length,
      identityChanges: identityDiffs.length,
    },
  };
}

export function applyPersonMerge(
  local: Person | null,
  imported: Person,
  diff: PersonSyncDiff,
  identityChoices: Record<string, 'keep_local' | 'use_imported'>,
  recordChoices: Record<string, ResolutionChoice>,
): Person {
  if (!local) {
    return JSON.parse(JSON.stringify(imported));
  }

  const merged: Person = { ...local, records: [] };

  for (const idDiff of diff.identityDiffs) {
    const choice = identityChoices[idDiff.field] || idDiff.choice;
    if (choice === 'use_imported') {
      if (idDiff.field === 'municipality') {
        merged.municipality = imported.municipality;
      } else {
        (merged as Record<string, unknown>)[idDiff.field] = imported[idDiff.field as keyof Person];
      }
    }
  }

  const finalRecords: Entry[] = [];

  for (const rDiff of diff.recordDiffs) {
    const choice = recordChoices[rDiff.id] || rDiff.choice;
    if (rDiff.status === 'identical') {
      finalRecords.push(rDiff.localRecord || rDiff.importedRecord!);
    } else if (rDiff.status === 'new_in_local') {
      if (choice === 'keep_local') {
        finalRecords.push(rDiff.localRecord!);
      }
    } else if (rDiff.status === 'new_in_import') {
      if (choice === 'use_imported') {
        finalRecords.push(rDiff.importedRecord!);
      }
    } else if (rDiff.status === 'modified') {
      if (choice === 'keep_local' && rDiff.localRecord) {
        finalRecords.push(rDiff.localRecord);
      } else if (choice === 'use_imported' && rDiff.importedRecord) {
        finalRecords.push({ ...rDiff.importedRecord, id: rDiff.localRecord?.id || rDiff.importedRecord.id });
      } else if (choice === 'keep_both') {
        if (rDiff.localRecord) finalRecords.push(rDiff.localRecord);
        if (rDiff.importedRecord) {
          finalRecords.push({
            ...rDiff.importedRecord,
            id: 'imp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
          });
        }
      }
    }
  }

  merged.records = finalRecords;
  return merged;
}
