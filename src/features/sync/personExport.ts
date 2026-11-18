import type { Person } from '../../shared/types';
import { APP_VERSION } from '../../shared/types';
import type { PersonExportFile } from './exportImportTypes';

export function exportPersonToFile(person: Person): void {
  const exportPayload: PersonExportFile = {
    format: 'calcolo-personale-export',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    person: JSON.parse(JSON.stringify(person)),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const cleanLast = (person.lastName || 'Persona').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanFirst = (person.firstName || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanCf = (person.fiscalCode || '').trim().toUpperCase();

  const fileName = `${cleanLast}_${cleanFirst}_${cleanCf || 'dati'}.calcolopersonale.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
