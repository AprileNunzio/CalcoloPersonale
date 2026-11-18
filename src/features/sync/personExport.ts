import type { Person } from '../../shared/types';
import { APP_VERSION } from '../../shared/types';
import type { PersonExportFile } from './exportImportTypes';

function showExportToast(msg: string): void {
  try {
    const existing = document.getElementById('export-toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'export-toast-notification';
    toast.innerText = msg;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--primary)',
      color: 'var(--surface)',
      padding: '12px 20px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(17, 107, 98, 0.35)',
      fontWeight: '600',
      fontSize: '13.5px',
      zIndex: '9999',
      whiteSpace: 'pre-line',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      opacity: '0',
      transform: 'translateY(10px)',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  } catch {}
}

export async function exportPersonToFile(person: Person): Promise<void> {
  const exportPayload: PersonExportFile = {
    format: 'calcolo-personale-export',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    person: JSON.parse(JSON.stringify(person)),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const cleanLast = (person.lastName || 'Persona').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanFirst = (person.firstName || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanCf = (person.fiscalCode || '').trim().toUpperCase();

  const fileName = `${cleanLast}_${cleanFirst}_${cleanCf || 'dati'}.calcolopersonale.json`;

  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Fascicolo Calcolo Personale (.json)',
            accept: { 'application/json': ['.json', '.calcolopersonale.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      showExportToast(`✓ Fascicolo esportato con successo!\n${fileName}`);
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('showSaveFilePicker failed, trying anchor download fallback', err);
    }
  }

  // Anchor fallback with delayed revoke so Chromium / WebView2 does not abort download
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  showExportToast(`✓ Download fascicolo avviato:\n${fileName}`);

  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {}
  }, 30000);
}
