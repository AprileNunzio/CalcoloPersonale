import {
  GraduationCap,
  ShieldCheck,
  Laptop,
  Award,
  AlertTriangle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Person, Entry } from '../../shared/types';
import { computeCulturalScore } from '../../shared/scoring/culturalScoring';
import './qualifications.css';

interface QualificationSummaryPanelProps {
  person: Person;
}

function parseQualNotes(notes: string): Record<string, unknown> {
  try {
    if (notes && notes.startsWith('{')) return JSON.parse(notes);
  } catch {
    return {};
  }
  return {};
}

export function QualificationSummaryPanel({ person }: QualificationSummaryPanelProps) {
  const qualifications = (person.records || []).filter(r => r.kind === 'qualification');
  const profile = person.profile || 'CS';

  let accessTitle: Entry | null = null;
  let hasCiad = false;
  let digitalPoints = 0;
  let degreePoints = 0;
  let otherCulturalPoints = 0;

  for (const q of qualifications) {
    const payload = parseQualNotes(q.notes);
    const titleLower = q.title.toLowerCase();

    if (payload.isAccessTitle || titleLower.includes('accesso') || titleLower.includes('maturit') || titleLower.includes('diploma di scuola')) {
      if (!accessTitle) accessTitle = q;
    } else if (payload.isCiad || titleLower.includes('ciad') || titleLower.includes('alfabetizzazione')) {
      hasCiad = true;
    } else if (payload.kind === 'digital' || titleLower.includes('eipass') || titleLower.includes('icdl') || titleLower.includes('ecdl') || titleLower.includes('digcomp')) {
      digitalPoints += typeof q.amount === 'number' ? q.amount : (profile === 'CS' ? 0.30 : 0.60);
    } else if (payload.kind === 'degree' || titleLower.includes('laurea')) {
      degreePoints += typeof q.amount === 'number' ? q.amount : (profile === 'CS' ? 1.00 : 2.00);
    } else {
      otherCulturalPoints += typeof q.amount === 'number' ? q.amount : 0;
    }
  }

  // Cap massimo certificazioni informatiche da bando ministeriale: max 0.60 AA/AT, max 0.30 CS/OS
  const maxDigitalCap = profile === 'CS' || profile === 'OS' ? 0.30 : 0.60;
  const effectiveDigitalPoints = Math.min(maxDigitalCap, digitalPoints);

  const accessPoints = accessTitle && typeof accessTitle.amount === 'number' ? accessTitle.amount : 0;
  const totalCulturalPoints = effectiveDigitalPoints + degreePoints + otherCulturalPoints;
  const grandTotal = Math.round((accessPoints + totalCulturalPoints) * 100) / 100;

  const requiresCiad = profile !== 'CS';

  return (
    <div className="qualification-summary-deck">
      <div className="qual-header-row">
        <div className="qual-header-title">
          <Award size={20} color="#0d9488" />
          <span>Quadro Riepilogativo Titoli Culturali & Requisiti ATA (D.M. 89/2024)</span>
        </div>
        <span
          style={{
            background: '#0f766e',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 8,
          }}
        >
          Totale Punti Titoli: {grandTotal.toFixed(2)} pt
        </span>
      </div>

      <div className="qual-stats-grid">
        <div className="qual-stat-card">
          <div className="qual-stat-label">
            <GraduationCap size={14} color="#0284c7" /> Titolo di Accesso
          </div>
          <div className="qual-stat-val">
            {accessTitle ? `${accessPoints.toFixed(2)} pt` : '0.00 pt'}
          </div>
          <div className="qual-stat-sub">
            {accessTitle ? accessTitle.title.slice(0, 32) + '...' : 'Nessun diploma inserito'}
          </div>
        </div>

        <div className="qual-stat-card">
          <div className="qual-stat-label">
            <Laptop size={14} color="#7c3aed" /> Certif. Informatiche
          </div>
          <div className="qual-stat-val">{effectiveDigitalPoints.toFixed(2)} pt</div>
          <div className="qual-stat-sub">
            {digitalPoints > maxDigitalCap ? `Cap max ministeriale (${maxDigitalCap.toFixed(2)} pt)` : `Max ${maxDigitalCap.toFixed(2)} pt per ${profile}`}
          </div>
        </div>

        <div className="qual-stat-card">
          <div className="qual-stat-label">
            <BookOpen size={14} color="#d97706" /> Lauree & Qualifiche
          </div>
          <div className="qual-stat-val">{(degreePoints + otherCulturalPoints).toFixed(2)} pt</div>
          <div className="qual-stat-sub">Laurea, Dattilografia, Concorsi</div>
        </div>

        <div className="qual-stat-card">
          <div className="qual-stat-label">
            <ShieldCheck size={14} color="#059669" /> Stato CIAD (CCNL 2024)
          </div>
          <div className="qual-stat-val" style={{ color: hasCiad ? '#059669' : requiresCiad ? '#d97706' : '#64748b' }}>
            {hasCiad ? 'Conforme ✓' : requiresCiad ? 'Mancante ⚠' : 'Non Richiesto'}
          </div>
          <div className="qual-stat-sub">Accredia DigComp 2.2</div>
        </div>
      </div>

      {requiresCiad && (
        <div className={`ciad-alert-box ${hasCiad ? 'valid' : 'missing'}`}>
          {hasCiad ? (
            <>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div>
                <strong>Requisito di Accesso CIAD Soddisfatto:</strong> Certificazione internazionale di alfabetizzazione digitale registrata e valida per l'inserimento nelle graduatorie ATA.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Attenzione CIAD Mancante (CCNL 18 gennaio 2024):</strong> Per il profilo {profile} la Certificazione Internazionale di Alfabetizzazione Digitale rilasciata da ente accreditato Accredia è requisito obbligatorio di accesso alle graduatorie.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
