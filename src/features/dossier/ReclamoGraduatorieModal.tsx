import { useState } from 'react';
import { FileWarning, Printer, X, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Person } from '../../shared/types';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { calculateProfileScores } from '../../shared/scoring';

export interface ReclamoGraduatorieModalProps {
  person: Person;
  onClose: () => void;
}

export function ReclamoGraduatorieModal({ person, onClose }: ReclamoGraduatorieModalProps) {
  const profileScores = calculateProfileScores(person);
  const primaryScore = profileScores[0];
  const targetProfile = person.profile || 'CS';

  const [scuolaCapofila, setScuolaCapofila] = useState('Al Dirigente Scolastico dell\'Istituto Comprensivo / IIS Capofila');
  const [pecScuola, setPecScuola] = useState('');
  const [protocolloGraduatoria, setProtocolloGraduatoria] = useState('Pubblicazione del gg/mm/aaaa');
  const [profiloScelto, setProfiloScelto] = useState(targetProfile);
  const [punteggioAttribuito, setPunteggioAttribuito] = useState(
    primaryScore ? (primaryScore.totalScore - 1.5).toFixed(2) : '0.00'
  );
  const [motivoReclamo, setMotivoReclamo] = useState(
    'Mancata corretta attribuzione del punteggio di servizio e/o titoli culturali rispetto alla tabella di valutazione allegata al D.M.'
  );

  const selectedScore = profileScores.find(p => p.code === profiloScelto) || primaryScore;
  const punteggioCorretto = selectedScore ? selectedScore.totalScore.toFixed(2) : '0.00';

  const todayStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const generateReclamoText = () => {
    return `OGGETTO: RECLAMO AVVERSO LA GRADUATORIA PROVVISORIA D'ISTITUTO DI III FASCIA PERSONALE A.T.A.
PROFILO PROFESSIONALE: ${PROFILE_LABELS[profiloScelto] || profiloScelto} (${profiloScelto})
AI SENSI DELL'ART. 8 DEL D.M. 89/2024 E DELL'ART. 21-NONIES DELLA LEGGE 241/90

Al Dirigente Scolastico: ${scuolaCapofila}
${pecScuola ? `Indirizzo PEC: ${pecScuola}` : ''}

Il/La sottoscritto/a:
Cognome e Nome: ${person.lastName} ${person.firstName}
Nato/a il: ${person.birthDate || 'N/D'}
Codice Fiscale: ${person.fiscalCode}
Residente in: ${person.municipality || 'N/D'}
Recapito telefonico / PEC / Email: ${person.fiscalCode}@istruzione.it

PREMESSO CHE
- In data ${protocolloGraduatoria} codesta Istituzione Scolastica ha pubblicato la graduatoria provvisoria d'istituto per il personale A.T.A. valida per il triennio di riferimento;
- Nella suddetta graduatoria al/alla sottoscritto/a è stato attribuito per il profilo di ${PROFILE_LABELS[profiloScelto] || profiloScelto} il punteggio provvisorio di punti ${punteggioAttribuito};

CONSIDERATO CHE
- Tale punteggio risulta palesemente erroneo e lesivo dei diritti del/della sottoscritto/a;
- In particolare si rileva: ${motivoReclamo};
- Dalla puntuale verifica dei titoli di accesso, di servizio e culturali regolarmente dichiarati nella domanda telematica POLIS, il punteggio effettivamente spettante ammonta a punti ${punteggioCorretto}, così articolato:
  * Titolo di accesso: ${selectedScore?.baseAccessScore.toFixed(2) || '0.00'} punti
  * Servizio specifico: ${selectedScore?.specificServiceScore.toFixed(2) || '0.00'} punti (${selectedScore?.specificDays || 0} giorni)
  * Altro servizio ATA/Docente: ${selectedScore?.otherServiceScore.toFixed(2) || '0.00'} punti
  * Titoli culturali e informatici (CIAD/EIPASS/Dattilografia): ${selectedScore?.culturalScore.toFixed(2) || '0.00'} punti
  * TOTALE CORRETTO SPETTANTE: ${punteggioCorretto} PUNTI;

Tutto ciò premesso e considerato, il/la sottoscritto/a

CHIEDE FORMALMENTE
in via di autotutela amministrativa ai sensi della Legge 7 agosto 1990 n. 241, il riesame degli atti della domanda e la conseguente RETTIFICA del punteggio attribuito nella graduatoria definitiva, con riconoscimento del punteggio complessivo pari a ${punteggioCorretto} punti.

Si allega copia del documento di identità e riepilogo dettagliato del fascicolo di servizio.

Luogo e Data: ${person.municipality || 'In sede'}, ${todayStr}

Firma del Ricorrente: _________________________________________
`;
  };

  const handlePrint = () => {
    const text = generateReclamoText();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Reclamo Graduatoria Provvisoria - ${person.lastName} ${person.firstName}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; padding: 40px; color: black; }
            h2 { text-align: center; font-size: 14pt; margin-bottom: 24px; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${text}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const text = generateReclamoText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reclamo_Graduatoria_${person.lastName}_${person.firstName}_${profiloScelto}.txt`;
    a.click();
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 30000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, maxWidth: 840, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        
        {/* HEADER */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileWarning color="var(--error)" size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--on-surface)' }}>Generatore Reclamo Graduatorie Provvisorie ATA</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--on-surface-variant)' }}>Autotutela Legge 241/90 e Art. 8 DM 89/2024 entro 10 giorni dalla pubblicazione</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Scuola Capofila Validante</label>
              <input
                type="text"
                value={scuolaCapofila}
                onChange={e => setScuolaCapofila(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid var(--outline-variant)', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>PEC o Email della Scuola</label>
              <input
                type="text"
                placeholder="es. rmps01000g@pec.istruzione.it"
                value={pecScuola}
                onChange={e => setPecScuola(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid var(--outline-variant)', borderRadius: 6, marginTop: 4 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Profilo Oggetto del Reclamo</label>
              <select
                value={profiloScelto}
                onChange={e => setProfiloScelto(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid var(--outline-variant)', borderRadius: 6, marginTop: 4 }}
              >
                {profileScores.map(ps => (
                  <option key={ps.code} value={ps.code}>{ps.label} ({ps.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--error)' }}>Punteggio Erroneo Assegnato</label>
              <input
                type="text"
                value={punteggioAttribuito}
                onChange={e => setPunteggioAttribuito(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid var(--outline-variant)', borderRadius: 6, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--secondary)' }}>Punteggio Corretto Spettante</label>
              <input
                type="text"
                value={punteggioCorretto}
                readOnly
                style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--surface-container-highest)', border: '1px solid var(--outline-variant)', borderRadius: 6, marginTop: 4, fontWeight: 700 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Dettaglio e Motivo del Reclamo</label>
            <textarea
              rows={2}
              value={motivoReclamo}
              onChange={e => setMotivoReclamo(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--outline-variant)', borderRadius: 6, marginTop: 4 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Anteprima Testo Reclamo Ufficiale</label>
            <div style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12, maxHeight: 220, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap', color: 'var(--on-surface)' }}>
              {generateReclamoText()}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
            Termine perentorio di 10 giorni dalla pubblicazione all'Albo pretorio.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={handleDownload} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={15} /> Scarica Testo (.txt)
            </button>
            <button type="button" onClick={handlePrint} className="primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={15} /> Stampa / Salva in PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
