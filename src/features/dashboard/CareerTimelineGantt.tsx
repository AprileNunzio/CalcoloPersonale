import { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Briefcase, Award, Sparkles, Filter } from 'lucide-react';
import { Person, Entry } from '../../shared/types';
import { parseDays } from '../../shared/scoring';
import { PROFILE_LABELS } from '../../shared/personUtils';

export interface CareerTimelineGanttProps {
  person: Person;
  targetProfile?: string;
}

interface ContractSegment {
  id: string;
  start: string;
  end: string;
  days: number;
  school: string;
  profile: string;
  isSpecific: boolean;
  isDocente: boolean;
  isStatale: boolean;
  startYear: number;
  schoolYear: string;
}

export function CareerTimelineGantt({ person, targetProfile = 'CS' }: CareerTimelineGanttProps) {
  const [filterProfile, setFilterProfile] = useState<string>('all');

  const segments = useMemo(() => {
    const rawServices = (person.records || []).filter(r => r.kind === 'service');
    const list: ContractSegment[] = [];

    for (const r of rawServices) {
      if (!r.start) continue;
      const start = r.start;
      const end = r.end || r.start;
      const days = parseDays(start, end);
      const prof = r.profile || targetProfile;
      const t = (r.title || '').toLowerCase();
      const isDocente = t.includes('docente') || t.includes('insegnante') || t.includes('primaria') || t.includes('infanzia') || t.includes('secondaria');
      const isSpecific = prof.toUpperCase() === targetProfile.toUpperCase() && !isDocente;

      const dStart = new Date(start);
      let sYear = dStart.getFullYear();
      if (dStart.getMonth() < 8) sYear -= 1;
      const schoolYear = `${sYear}/${sYear + 1}`;

      list.push({
        id: r.id,
        start,
        end,
        days,
        school: r.school?.name || r.title || 'Istituto Scolastico',
        profile: prof,
        isSpecific,
        isDocente,
        isStatale: !t.includes('paritaria'),
        startYear: sYear,
        schoolYear,
      });
    }

    list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return list;
  }, [person.records, targetProfile]);

  // Compute cumulative valid days for 24 months milestone (706 days)
  let cumulativeDays = 0;
  let milestoneHitIndex = -1;
  segments.forEach((seg, idx) => {
    if (!seg.isDocente && seg.isStatale) {
      cumulativeDays += seg.days;
      if (cumulativeDays >= 706 && milestoneHitIndex === -1) {
        milestoneHitIndex = idx;
      }
    }
  });

  // Group by school year
  const schoolYears = useMemo(() => {
    const map = new Map<string, ContractSegment[]>();
    for (const s of segments) {
      if (filterProfile !== 'all' && s.profile !== filterProfile) continue;
      const arr = map.get(s.schoolYear) || [];
      arr.push(s);
      map.set(s.schoolYear, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [segments, filterProfile]);

  const getProfileColor = (prof: string, isDocente: boolean) => {
    if (isDocente) return 'var(--tertiary)'; // Amber for docente
    switch (prof.toUpperCase()) {
      case 'CS': return 'var(--secondary)'; // Green
      case 'AA': return 'var(--primary)'; // Blue
      case 'AT': return 'var(--primary)'; // Purple
      case 'OS': return 'var(--primary)'; // Sky
      default: return 'var(--on-surface-variant)';   // Slate
    }
  };

  if (segments.length === 0) {
    return (
      <div style={{ background: 'var(--surface-container-high)', border: '1px dashed var(--outline-variant)', borderRadius: 8, padding: '24px 16px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
        <Calendar size={28} style={{ opacity: 0.5, marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 13 }}>Nessun servizio registrato. Inserisci i tuoi contratti nella sezione "Servizi" per visualizzare la timeline grafica della carriera.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: 10, padding: 16 }}>
      {/* HEADER & FILTERS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--on-surface)' }}>
            <Calendar size={18} color="var(--primary)" /> Timeline Grafica Carriera ATA & Traguardo 24 Mesi
          </h4>
          <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
            Visualizzazione cronologica per anno scolastico (1 Settembre - 31 Agosto) con calcolo soglia 706 giorni.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--on-surface-variant)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} /> Filtra Profilo:
          </span>
          <select
            value={filterProfile}
            onChange={e => setFilterProfile(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--outline-variant)', borderRadius: 6 }}
          >
            <option value="all">Tutti i Profili</option>
            <option value="CS">Collaboratore Scolastico (CS)</option>
            <option value="AA">Assistente Amministrativo (AA)</option>
            <option value="AT">Assistente Tecnico (AT)</option>
            <option value="OS">Operatore Scolastico (OS)</option>
          </select>
        </div>
      </div>

      {/* 24 MONTHS BADGE */}
      <div style={{ background: milestoneHitIndex !== -1 ? 'var(--secondary-container)' : 'var(--primary-container)', border: `1px solid ${milestoneHitIndex !== -1 ? 'var(--outline-variant)' : 'var(--outline-variant)'}`, padding: '10px 14px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {milestoneHitIndex !== -1 ? (
            <Award size={22} color="var(--secondary)" />
          ) : (
            <Sparkles size={22} color="var(--primary)" />
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: milestoneHitIndex !== -1 ? 'var(--secondary)' : 'var(--primary)' }}>
              {milestoneHitIndex !== -1 ? (
                `Traguardo 24 Mesi RAGGIUNTO (${cumulativeDays} / 706 giorni maturate)`
              ) : (
                `Progressione verso la 1ª Fascia ATA (24 Mesi): ${cumulativeDays} / 706 giorni (~${Math.max(0, 706 - cumulativeDays)} gg rimanenti)`
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
              {milestoneHitIndex !== -1 ? (
                `Soglia superata nel contratto: "${segments[milestoneHitIndex].school}" (${segments[milestoneHitIndex].schoolYear})`
              ) : (
                'Occorrono 23 mesi e 16 giorni di servizio effettivo in scuole statali (Art. 554 D.Lgs. 297/94).'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {schoolYears.map(([sYear, list]) => {
          const totalDaysInYear = list.reduce((acc, c) => acc + c.days, 0);

          return (
            <div key={sYear} style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                  Anno Scolastico {sYear}
                </span>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                  {totalDaysInYear} giorni totali coperti ({list.length} contratt{list.length === 1 ? 'o' : 'i'})
                </span>
              </div>

              {/* SEGMENT BARS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.map(seg => {
                  const color = getProfileColor(seg.profile, seg.isDocente);
                  const isMilestone = segments[milestoneHitIndex]?.id === seg.id;

                  return (
                    <div
                      key={seg.id}
                      style={{
                        background: 'var(--surface)',
                        border: `1px solid ${isMilestone ? 'var(--tertiary)' : 'var(--outline-variant)'}`,
                        borderLeft: `5px solid ${color}`,
                        borderRadius: 6,
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: isMilestone ? '0 0 0 2px rgba(251, 191, 36, 0.3)' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>
                            {seg.school}
                          </span>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: color, color: 'var(--surface)', fontWeight: 700 }}>
                            {seg.isDocente ? 'DOCENTE' : seg.profile}
                          </span>
                          {isMilestone && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--tertiary-container)', color: 'var(--tertiary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              ★ Traguardo 24M Raggiunto Qui!
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                          Dal {new Date(seg.start).toLocaleDateString('it-IT')} al {new Date(seg.end).toLocaleDateString('it-IT')} · {seg.days} giorni di calendario
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>
                          {seg.isDocente ? 'Servizio Docente' : seg.isSpecific ? 'Servizio Specifico' : 'Altro ATA'}
                        </span>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>
                          {seg.isStatale ? 'Scuola Statale' : 'Scuola Paritaria'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
