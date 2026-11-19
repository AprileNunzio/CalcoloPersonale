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
  FileWarning,
  Banknote,
  Lock,
} from 'lucide-react';
import { Person, Archive } from '../../shared/types';
import { calculateProfileScores } from '../../shared/scoring';
import { computeFirstTierEligibility } from '../../shared/careerPrediction';
import { computeComprehensiveFamilyOverview } from '../../shared/familyLeave';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { AutoSaveContext } from '../autosave/AutoSave';
import { flush } from '../autosave/store';
import { call, getRevision } from '../../shared/api';
import { encryptBackup, decryptBackup } from '../../shared/backupCrypto';
import { ReclamoGraduatorieModal } from './ReclamoGraduatorieModal';
import { NaspiSimulatorModal } from './NaspiSimulatorModal';
import { CareerTimelineGantt } from '../dashboard/CareerTimelineGantt';
import { ProfileBadge3d } from '../../shared/icons3d';
import './dossier.css';

export function DossierExportPane({ person }: { person: Person }) {
  const context = useContext(AutoSaveContext);
  const allPeople = context?.archive.people || [];

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showReclamoModal, setShowReclamoModal] = useState(false);
  const [showNaspiModal, setShowNaspiModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileScores = calculateProfileScores(person);
  const primaryScore = profileScores[0] || null;
  const targetProfile = person.profile || (profileScores[0]?.code ?? 'CS');
  const firstTierList = profileScores.map(ps => ({
    ...computeFirstTierEligibility(person, ps.code),
    label: ps.label,
  }));
  const familyOverview = computeComprehensiveFamilyOverview(person, allPeople);

  const todayStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportBackup = async () => {
    if (!context?.archive) return;
    try {
      const pwd = window.prompt(
        'Imposta una password sicura per cifrare il backup (AES-256-GCM):\nLascia vuoto per esportare senza cifratura.',
      );
      if (pwd === null) return; // User canceled

      const encryptedText = await encryptBackup(context.archive, pwd);
      const isEncrypted = pwd && pwd.trim().length > 0;
      const blob = new Blob([encryptedText], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_calcolo_personale_${isEncrypted ? 'cifrato_' : ''}${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }, 30000);
      setFeedbackMsg(
        isEncrypted
          ? 'Backup cifrato con successo con AES-256-GCM!'
          : 'Backup esportato in chiaro (senza password).',
      );
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Errore durante l\'esportazione del backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const importedArchive = await decryptBackup(text, async () => {
          const pwd = window.prompt('Il backup è cifrato con AES-256. Inserisci la password di sblocco:');
          return pwd || '';
        });

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
      } catch (err: any) {
        setErrorMsg(err?.message || 'Impossibile importare il backup: formato corrotto o password errata.');
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
            <FileText size={20} color="var(--primary)" /> Scheda Fascicolo per Sindacati/Patronati & Strumenti ATA
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--on-surface-variant)' }}>
            Genera il prospetto riepilogativo ufficiale del punteggio e dei titoli per verifiche, reclami, NASpI o patronato.
          </p>
        </div>

        <div className="dossier-actions-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="secondary"
            onClick={() => setShowTimeline(!showTimeline)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Clock size={16} /> {showTimeline ? 'Nascondi Timeline' : 'Timeline Carriera'}
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => setShowReclamoModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--error)' }}
          >
            <FileWarning size={16} /> Reclamo Graduatoria
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => setShowNaspiModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)' }}
          >
            <Banknote size={16} /> Simulatore NASpI
          </button>

          <button
            type="button"
            className="primary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={16} /> Stampa Scheda
          </button>

          <button
            type="button"
            className="secondary"
            onClick={handleExportBackup}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Lock size={16} /> Backup Cifrato
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Upload size={16} /> Ripristina
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

      {showReclamoModal && (
        <ReclamoGraduatorieModal person={person} onClose={() => setShowReclamoModal(false)} />
      )}

      {showNaspiModal && (
        <NaspiSimulatorModal person={person} onClose={() => setShowNaspiModal(false)} />
      )}

      {showTimeline && (
        <div style={{ marginBottom: 20 }}>
          <CareerTimelineGantt person={person} targetProfile={targetProfile} />
        </div>
      )}

      {feedbackMsg && (
        <div style={{ background: 'var(--secondary-container)', color: 'var(--secondary)', border: '1px solid var(--outline-variant)', padding: '10px 14px', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'var(--error-container)', color: 'var(--error)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
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
                  <td style={{ textAlign: 'right', color: 'var(--secondary)', fontSize: 13, fontWeight: 700 }}>
                    {ps.effectiveScore.toFixed(2)} pt
                    {ps.useValidatedScore && (
                      <div style={{ fontSize: 10, color: 'var(--secondary)', fontWeight: 600 }}>
                        ✓ Convalidato da Decreto Scuola {ps.validationDecree ? `(${ps.validationDecree})` : ''}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. SITUAZIONE 1ª FASCIA (24 MESI ATA) */}
        <div className="dossier-section">
          <div className="dossier-section-title">3. Verifica Requisiti Graduatoria 24 Mesi ATA (Art. 554 D.Lgs. 297/94)</div>
          <p style={{ margin: '0 0 10px 0', fontSize: 11, color: 'var(--on-surface-variant)' }}>
            Requisito di accesso alla 1ª Fascia Permanente: 23 mesi e 16 giorni (706 giorni effettivi) di servizio statale. Di seguito il prospetto analitico distinto per ciascun profilo inserito (servizio specifico, servizio cumulato in altri profili ATA e servizio docente escluso ex lege):
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid var(--outline-variant)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Profilo ATA</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Specifico</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Altri ATA</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Docente (Escl.)</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Validi / 706 gg</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>% Comp.</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Stato 24 Mesi</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Finestra Utile</th>
                </tr>
              </thead>
              <tbody>
                {firstTierList.map(ft => (
                  <tr key={ft.profileCode} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <td style={{ padding: '8px', fontWeight: 650 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ProfileBadge3d code={ft.profileCode} size={20} />
                        <span>{ft.profileCode}</span>
                        <small style={{ color: 'var(--on-surface-variant)', fontWeight: 400 }}>· {ft.label.split('(')[0]}</small>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: 600 }}>{ft.specificDays} gg</td>
                    <td style={{ textAlign: 'right', padding: '8px', color: 'var(--on-surface-variant)' }}>{ft.otherAtaDays} gg</td>
                    <td style={{ textAlign: 'right', padding: '8px', color: 'var(--on-surface-variant)' }}>{ft.docenteDays} gg</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: 700, color: 'var(--on-surface)' }}>{ft.totalDays} / 706 gg</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <span style={{ fontWeight: 700, color: ft.isEligible ? 'var(--secondary)' : 'var(--primary)' }}>
                        {ft.percentCompleted}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 700,
                          background: ft.isEligible ? 'var(--secondary-container)' : 'var(--surface-container-highest)',
                          color: ft.isEligible ? 'var(--secondary)' : 'var(--tertiary)',
                        }}
                      >
                        {ft.isEligible ? '✓ RAGGIUNTO' : `Mancano ${ft.remainingDays} gg`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                      {ft.projectedWindow}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--outline-variant)', paddingTop: 16 }}>
          <div>Firma del Candidato: ___________________________</div>
          <div>Timbro / Visto di conformità: ___________________________</div>
        </div>
      </div>
    </div>
  );
}
