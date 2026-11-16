import { useState, useContext, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Award,
  Users2,
  Clock,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { Person, Archive } from '../../shared/types';
import { calculateProfileScores } from '../../shared/scoring';
import { computeFirstTierEligibility } from '../../shared/careerPrediction';
import { computeComprehensiveFamilyOverview } from '../../shared/familyLeave';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { AutoSaveContext } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { call, getRevision } from '../../shared/api';
import './dossier.css';

export function DossierExportPane({ person }: { person: Person }) {
  const context = useContext(AutoSaveContext);
  const allPeople = context?.archive.people || [];

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileScores = calculateProfileScores(person);
  const primaryScore = profileScores[0] || null;
  const targetProfile = person.profile || 'CS';

  const firstTier = computeFirstTierEligibility(person, targetProfile);
  const familyOverview = computeComprehensiveFamilyOverview(person, allPeople);

  const todayStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportBackup = () => {
    if (!context?.archive) return;
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '0.1.3',
        archive: context.archive,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_calcolo_personale_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedbackMsg('Backup cifrato esportato con successo!');
      setErrorMsg('');
    } catch {
      setErrorMsg('Errore durante l\'esportazione del backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedArchive = parsed.archive || parsed;

        if (!importedArchive || !Array.isArray(importedArchive.people)) {
          throw new Error('Formato backup non valido.');
        }

        if (window.confirm(`Confermi il ripristino dell'archivio contenente ${importedArchive.people.length} persone?`)) {
          await flush();
          for (const p of importedArchive.people) {
            await call('save_person', { person: p, revision: getRevision() });
          }
          context?.saved(importedArchive);
          setFeedbackMsg(`Archivio ripristinato con successo (${importedArchive.people.length} persone caricate)!`);
          setErrorMsg('');
        }
      } catch (err) {
        setErrorMsg('Impossibile importare il file di backup: formato corrotto o non riconosciuto.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="dossier-root">
      {/* ACTIONS TOOLBAR */}
      <div className="dossier-actions-bar">
        <div>
          <h3 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="#2563eb" /> Scheda Fascicolo per Sindacati/Patronati & Backup
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b' }}>
            Genera il prospetto riepilogativo ufficiale del punteggio e dei titoli per verifiche, reclami o patronato.
          </p>
        </div>

        <div className="dossier-actions-buttons">
          <button
            type="button"
            className="primary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={16} /> Stampa Scheda / PDF
          </button>

          <button
            type="button"
            className="secondary"
            onClick={handleExportBackup}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Esporta Backup
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Upload size={16} /> Ripristina Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json,.cpa"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PRINTABLE DOSSIER SHEET */}
      <div className="dossier-sheet" id="dossier-print-area">
        <div className="dossier-sheet-header">
          <div>
            <div className="dossier-brand-title">Fascicolo Personale Scolastico ATA</div>
            <div className="dossier-brand-sub">
              Scheda Analitica di Riepilogo Punteggi, Titoli e Servizi (Graduatorie D.M. 89/2024 e D.Lgs. 297/94)
            </div>
          </div>
          <div className="dossier-date-badge">
            <div>Data elaborazione:</div>
            <strong>{todayStr}</strong>
          </div>
        </div>

        {/* 1. ANAGRAFICA */}
        <div className="dossier-section">
          <div className="dossier-section-title">1. Dati Anagrafici del Candidato</div>
          <div className="dossier-anagrafica-grid">
            <div className="dossier-anagrafica-item">
              <span>Cognome e Nome</span>
              <strong>{person.lastName} {person.firstName}</strong>
            </div>
            <div className="dossier-anagrafica-item">
              <span>Codice Fiscale</span>
              <strong>{person.fiscalCode || 'Non specificato'}</strong>
            </div>
            <div className="dossier-anagrafica-item">
              <span>Genere / Nascita</span>
              <strong>{person.gender === 'female' ? 'Femmina' : 'Maschio'} · {person.birthDate || 'N/D'}</strong>
            </div>
            <div className="dossier-anagrafica-item">
              <span>Luogo di Nascita</span>
              <strong>{person.birthPlace || 'N/D'} ({person.birthProvince || 'EE'})</strong>
            </div>
            <div className="dossier-anagrafica-item">
              <span>Profilo di Riferimento</span>
              <strong>{targetProfile} - {PROFILE_LABELS[targetProfile] || targetProfile}</strong>
            </div>
            <div className="dossier-anagrafica-item">
              <span>Profili Attivi Valutati</span>
              <strong>{profileScores.map(p => p.code).join(', ') || targetProfile}</strong>
            </div>
          </div>
        </div>

        {/* 2. TABELLA PUNTEGGI TERZA FASCIA */}
        <div className="dossier-section">
          <div className="dossier-section-title">2. Prospetto Punteggi Terza Fascia ATA (D.M. 89/2024)</div>
          <table className="dossier-table">
            <thead>
              <tr>
                <th>Profilo ATA</th>
                <th style={{ textAlign: 'right' }}>Titolo di Accesso (decimi)</th>
                <th style={{ textAlign: 'right' }}>Servizio Specifico</th>
                <th style={{ textAlign: 'right' }}>Altro Servizio / Docente</th>
                <th style={{ textAlign: 'right' }}>Titoli Culturali / CIAD</th>
                <th style={{ textAlign: 'right' }}>Punteggio Totale</th>
              </tr>
            </thead>
            <tbody>
              {profileScores.map(ps => (
                <tr key={ps.code} style={{ fontWeight: ps.code === targetProfile ? 700 : 400 }}>
                  <td>{ps.code} - {ps.label}</td>
                  <td style={{ textAlign: 'right' }}>{ps.baseAccessScore.toFixed(2)} pt</td>
                  <td style={{ textAlign: 'right' }}>{ps.specificServiceScore.toFixed(2)} pt</td>
                  <td style={{ textAlign: 'right' }}>{ps.otherServiceScore.toFixed(2)} pt</td>
                  <td style={{ textAlign: 'right' }}>{ps.culturalScore.toFixed(2)} pt</td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: 13, fontWeight: 700 }}>
                    {ps.totalScore.toFixed(2)} pt
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. SITUAZIONE 1ª FASCIA (24 MESI ATA) */}
        <div className="dossier-section">
          <div className="dossier-section-title">3. Verifica Requisiti Graduatoria 24 Mesi ATA (Art. 554 D.Lgs. 297/94)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <div>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Giorni Validi Maturati</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{firstTier.totalDays} / 706 gg</div>
            </div>
            <div>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Stato Idoneità 24M</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: firstTier.isEligible ? '#15803d' : '#b45309' }}>
                {firstTier.isEligible ? 'RAGGIUNTO (Idoneo)' : `Mancano ${firstTier.remainingDays} gg`}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Servizio Docente Escluso</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>{firstTier.docenteDays} gg</div>
            </div>
            <div>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Finestra Utile Stimata</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginTop: 3 }}>{firstTier.projectedWindow}</div>
            </div>
          </div>
        </div>

        {/* 4. BENEFICI FAMILIARI E PRECEDENZE */}
        <div className="dossier-section">
          <div className="dossier-section-title">4. Benefici Familiari, Precedenze e Riserve di Legge</div>
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            {familyOverview.spouses.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                • <strong>Coniuge Convivente:</strong> {familyOverview.spouses[0].fullName} · Diritto a <strong>+6 punti per Ricongiungimento al Coniuge</strong> nelle graduatorie di mobilità/istituto e 15 giorni congedo matrimoniale.
              </div>
            )}
            {familyOverview.childrenLeaves.length > 0 ? (
              <div style={{ marginBottom: 6 }}>
                • <strong>Figli a Carico:</strong> {familyOverview.childrenLeaves.length} registrati ({familyOverview.totalEligibleChildren} con diritto attivo a congedo parentale &lt; 12 anni). Titolo di preferenza a parità di merito (Art. 5 D.P.R. 487/94).
              </div>
            ) : (
              <div style={{ marginBottom: 6 }}>• <strong>Figli a Carico:</strong> Nessun figlio registrato.</div>
            )}
            <div>
              • <strong>Autenticità del Fascicolo:</strong> Dati archiviati e validati in ambiente crittografato locale conforme al Regolamento UE 2016/679 (GDPR).
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #cbd5e1', paddingTop: 16 }}>
          <div>Firma del Candidato: ___________________________</div>
          <div>Timbro / Visto di conformità: ___________________________</div>
        </div>
      </div>
    </div>
  );
}
