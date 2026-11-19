import { X, GraduationCap, Award, Briefcase, Calendar, ShieldCheck, Scale, CheckCircle2, AlertTriangle, Crown } from 'lucide-react';
import { ProfileScore } from '../../shared/scoring';
import { Person, Entry } from '../../shared/types';
import { ProfileBadge3d } from '../../shared/icons3d';
import { extractAccessQualification } from '../../shared/scoring/accessScoring';
import { formatDateItalian } from '../../shared/dateUtils';
import './ScoreTimelineAuditPanel.css';

interface ScoreTimelineAuditPanelProps {
  score: ProfileScore;
  person?: Person;
  onClose: () => void;
}

export function ScoreTimelineAuditPanel({ score, person, onClose }: ScoreTimelineAuditPanelProps) {
  const records = person?.records || [];
  const accessQual = extractAccessQualification(records, score.code);

  const quals = records.filter(r => r.kind === 'qualification');
  const services = records.filter(r => r.kind === 'service');

  return (
    <div className="score-audit-panel">
      <div className="score-audit-header">
        <div className="score-audit-title-col">
          <ProfileBadge3d code={score.code} size={36} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3>Timeline & Audit Calcolo Punteggio {score.label} ({score.code})</h3>
              <span className="audit-decree-pill">D.M. 89/2024</span>
            </div>
            <p className="score-audit-subtitle">
              Cronistoria dettagliata e tracciamento matematico conforme all'Ordinanza Ministeriale
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="score-audit-total-pill">
            <span>Punteggio Effettivo:</span>
            <strong>{score.effectiveScore.toFixed(2)} pt</strong>
          </div>
          <button type="button" className="audit-close-btn" onClick={onClose} title="Chiudi timeline">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="score-audit-sections-grid">
        {/* 1. Titolo di Accesso */}
        <div className="audit-card">
          <div className="audit-card-header">
            <GraduationCap size={18} color="var(--primary)" />
            <h4>1. Titolo di Accesso (Base)</h4>
            <span className="audit-score-subtotal">+{score.baseAccessScore.toFixed(2)} pt</span>
          </div>
          <div className="audit-card-body">
            {accessQual ? (
              <div className="audit-entry-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{accessQual.title}</strong>
                  <span className="audit-tag primary">Valutato</span>
                </div>
                <div className="audit-entry-sub">
                  {accessQual.notes && accessQual.notes.startsWith('{') ? (() => {
                    try {
                      const p = JSON.parse(accessQual.notes);
                      if (p.scoreAchieved && p.scoreBase) {
                        return (
                          <span>
                            Voto conseguito: <strong>{p.scoreAchieved}/{p.scoreBase}</strong>
                            {' '}· Formula: <code>({p.scoreAchieved} / {p.scoreBase}) × 10 = {score.baseAccessScore.toFixed(2)} pt</code>
                          </span>
                        );
                      }
                    } catch {}
                    return null;
                  })() : null}
                  {typeof accessQual.amount === 'number' && (
                    <span>Punteggio inserito: <strong>{accessQual.amount.toFixed(2)} pt</strong></span>
                  )}
                  {accessQual.start && (
                    <span>Data conseguimento: {formatDateItalian(accessQual.start)}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="muted-text">Nessun titolo di accesso esplicito registrato per {score.code} (Base: 0.00 pt).</p>
            )}
          </div>
        </div>

        {/* 2. Titoli Culturali & Certificazioni */}
        <div className="audit-card">
          <div className="audit-card-header">
            <Award size={18} color="var(--secondary)" />
            <h4>2. Titoli Culturali & Certificazioni</h4>
            <span className="audit-score-subtotal">+{score.culturalScore.toFixed(2)} pt</span>
          </div>
          <div className="audit-card-body">
            {quals.length === 0 ? (
              <p className="muted-text">Nessun titolo culturale aggiuntivo registrato.</p>
            ) : (
              quals
                .filter(q => q.id !== accessQual?.id)
                .map(q => {
                  const t = (q.title + ' ' + (q.notes || '')).toLowerCase();
                  let pts = 0;
                  let note = '';
                  if (t.includes('alfabetizzazione') || t.includes('ciad') || t.includes('ecdl') || t.includes('eipass') || t.includes('digcomp') || t.includes('informatica')) {
                    pts = score.code === 'CS' ? 0.30 : 0.60;
                    note = 'Certificazione Informatica Digitale (max 1 valutabile)';
                  } else if (t.includes('laurea')) {
                    pts = (score.code === 'AA' || score.code === 'AT') ? 2.0 : 0;
                    note = 'Laurea Magistrale/Triennale';
                  } else if (t.includes('dattilografia') && score.code === 'AA') {
                    pts = 1.0;
                    note = 'Attestato Dattilografia (solo AA)';
                  } else if ((t.includes('oss') || t.includes('osa')) && score.code === 'OS') {
                    pts = 1.0;
                    note = 'Qualifica OSS/OSA (solo OS)';
                  }

                  return (
                    <div key={q.id} className="audit-entry-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{q.title}</span>
                        {pts > 0 ? (
                          <strong style={{ color: 'var(--secondary)' }}>+{pts.toFixed(2)} pt</strong>
                        ) : (
                          <small style={{ color: 'var(--on-surface-variant)' }}>0.00 pt</small>
                        )}
                      </div>
                      {note && <small className="audit-hint-text">{note}</small>}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* 3. Cronologia Anno per Anno Servizi Statali */}
      <div className="audit-card wide" style={{ marginTop: 14 }}>
        <div className="audit-card-header">
          <Briefcase size={18} color="var(--tertiary)" />
          <h4>3. Timeline Cronologica Servizi ATA (Anno Scolastico per Anno Scolastico)</h4>
          <span className="audit-score-subtotal">
            +{(score.specificServiceScore + score.otherServiceScore).toFixed(2)} pt
          </span>
        </div>

        <div className="audit-card-body">
          <p className="audit-law-notice">
            <Scale size={14} style={{ flexShrink: 0 }} />
            <span>
              Secondo l'Allegato A del D.M. 89/2024: il servizio nel profilo {score.code} è <strong>Specifico</strong> (0.60 pt/mese per AA/AT, 0.50 pt per CS). Il servizio in altro profilo ATA statale è valutato <strong>0.10 pt/mese per AA/AT</strong> (0.15 pt per CS). Max 6.00 pt ad anno scolastico.
            </span>
          </p>

          {score.schoolYearBreakdown.length === 0 ? (
            <p className="muted-text">Nessun servizio registrato concorre a questo profilo.</p>
          ) : (
            <div className="audit-timeline-flow">
              {score.schoolYearBreakdown.map(sy => (
                <div key={sy.schoolYear} className={`audit-sy-row ${sy.isCapped ? 'is-capped' : ''}`}>
                  <div className="audit-sy-col-badge">
                    <span className="audit-sy-tag">A.S. {sy.schoolYear}</span>
                    <small>{sy.days} gg ({sy.months} {sy.months === 1 ? 'mese' : 'mesi'})</small>
                  </div>

                  <div className="audit-sy-col-details">
                    <div className="audit-sy-scores-line">
                      <span>Specifico ({score.code}): <strong>+{sy.specificScore.toFixed(2)} pt</strong></span>
                      <span>Altro ATA: <strong>+{sy.otherScore.toFixed(2)} pt</strong></span>
                      {sy.isCapped && (
                        <span className="audit-capped-warning">
                          ⚠️ Tetto max 6.00 pt applicato (Grezzo: {sy.totalAnnualScore.toFixed(2)} pt)
                        </span>
                      )}
                    </div>

                    <div className="audit-sy-services-list">
                      {services
                        .filter(s => {
                          const sStart = s.start || '';
                          const syStart = `${sy.startYear}-09-01`;
                          const syEnd = `${sy.endYear}-08-31`;
                          return (s.end && s.end >= syStart && sStart <= syEnd) || (!s.end && sStart <= syEnd);
                        })
                        .map(s => {
                          const isSpec = s.profile === score.code;
                          let parsed: Record<string, unknown> = {};
                          try { if (s.notes?.startsWith('{')) parsed = JSON.parse(s.notes); } catch {}
                          const isRuoloRec = parsed.isRuolo === true || parsed.contractType === 'permanent';

                          return (
                            <div key={s.id} className="audit-sy-service-item">
                              <span className={`service-type-dot ${isSpec ? 'spec' : 'other'}`} />
                              <span>{s.school?.name || s.title}</span>
                              <span className="service-dates-tag">
                                {formatDateItalian(s.start)} - {s.end ? formatDateItalian(s.end) : isRuoloRec ? 'In corso (Ruolo)' : 'In corso'}
                              </span>
                              <span className="service-role-tag">{s.profile || 'CS'}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="audit-sy-col-total">
                    <strong>+{sy.cappedScore.toFixed(2)} pt</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formula Finale */}
      <div className="score-audit-summary-footer">
        <div className="audit-formula-line">
          <span>Formula:</span>
          <code>
            {score.baseAccessScore.toFixed(2)} (Accesso) + {score.specificServiceScore.toFixed(2)} (Serv. Specifico) + {score.otherServiceScore.toFixed(2)} (Altro Servizio) + {score.culturalScore.toFixed(2)} (Culturali) = <strong>{score.totalScore.toFixed(2)} pt</strong>
          </code>
        </div>
        {score.useValidatedScore && (
          <div className="audit-convalidated-box">
            <CheckCircle2 size={16} />
            <span>Punteggio convalidato da {score.validatingSchool || 'Istituzione Scolastica'} (Decreto: {score.validationDecree || 'Atti d\'Ufficio'}): <strong>{score.effectiveScore.toFixed(2)} pt</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
