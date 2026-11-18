import { Archive, Person } from '../../shared/types';

export function getSectionTheme(
  archive: Archive | null,
  person: Person | undefined,
  section: string,
): string {
  if (!archive) return 'vault';
  if (!person) {
    if (section === 'assistant') return 'assistente';
    if (section === 'updates') return 'aggiornamenti';
    return 'utenti';
  }

  switch (section) {
    case 'overview':
      return 'dashboard';
    case 'identity':
      return 'identita';
    case 'service':
      return 'servizi';
    case 'qualification':
      return 'titoli';
    case 'absences':
      return 'assenze';
    case 'child':
      return 'famiglia';
    case 'salary':
      return 'stipendio';
    case 'naspi':
      return 'naspi';
    case 'schools30':
      return 'scuole';
    case 'dossier':
      return 'dossier';
    case 'applications':
      return 'domande';
    case 'assistant':
      return 'assistente';
    case 'updates':
      return 'aggiornamenti';
    default:
      return 'dashboard';
  }
}
