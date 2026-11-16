import { Person } from './types';

export const ATA_PROFILES = [
  { code: 'CS', label: 'Collaboratore Scolastico (CS)' },
  { code: 'AA', label: 'Assistente Amministrativo (AA)' },
  { code: 'AT', label: 'Assistente Tecnico (AT)' },
  { code: 'OS', label: 'Operatore Scolastico (OS)' },
  { code: 'CO', label: 'Cuoco (CO)' },
  { code: 'IF', label: 'Infermiere (IF)' },
  { code: 'GA', label: 'Guardarobiere (GA)' },
] as const;

export const PROFILE_LABELS: Record<string, string> = {
  CS: 'Collaboratore Scolastico',
  AA: 'Assistente Amministrativo',
  AT: 'Assistente Tecnico',
  OS: 'Operatore Scolastico',
  CO: 'Cuoco',
  IF: 'Infermiere',
  GA: 'Guardarobiere',
};

export function getPersonCurrentProfile(person: Person): { code: string; label: string; isDerived: boolean } {
  const serviceRecords = (person.records || [])
    .filter(r => r.kind === 'service' && r.profile)
    .sort((a, b) => {
      const endA = a.end || a.start || '';
      const endB = b.end || b.start || '';
      return endB.localeCompare(endA);
    });

  if (serviceRecords.length > 0 && serviceRecords[0].profile) {
    const code = serviceRecords[0].profile;
    return {
      code,
      label: PROFILE_LABELS[code] || code,
      isDerived: true,
    };
  }

  if (person.profile && person.profile in PROFILE_LABELS) {
    return {
      code: person.profile,
      label: PROFILE_LABELS[person.profile] || person.profile,
      isDerived: false,
    };
  }

  return {
    code: '—',
    label: 'Nessun servizio registrato',
    isDerived: true,
  };
}
