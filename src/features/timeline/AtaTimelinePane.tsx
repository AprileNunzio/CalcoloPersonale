import React from 'react';
import {
  CalendarDays,
  Clock,
  Award,
  CheckCircle2,
  Hourglass,
  CalendarRange,
  Scale,
  Briefcase,
} from 'lucide-react';
import type { Person } from '../../shared/types';
import { computeTimelineDeadlines } from './timelineCalculations';
import { formatDateItalian } from '../../shared/dateUtils';
import './timeline.css';

interface AtaTimelinePaneProps {
  person: Person;
}

export function AtaTimelinePane({ person }: AtaTimelinePaneProps) {
  const data = computeTimelineDeadlines(person);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'naspi':
        return <Hourglass size={20} />;
      case 'graduatorie24m':
        return <Award size={20} />;
      case 'contract_end':
        return <Briefcase size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  return (
    <div className="timeline-root">
      {/* Hero Banner */}
      <div className="timeline-hero-banner">
        <div className="timeline-hero-title-group">
          <h2>
            <CalendarDays size={24} color="var(--primary)" />
            <span>Timeline e Scadenziario Normativo ATA</span>
          </h2>
          <p>
            Monitoraggio intelligente dei termini di legge: finestra 68 giorni NASpI INPS, maturazione 24 mesi e
            scadenza contratti in corso.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: data.is24MesiReached ? 'var(--secondary-container)' : 'var(--surface-container-high)',
              border: `1.5px solid ${data.is24MesiReached ? 'var(--outline-variant)' : 'var(--outline-variant)'}`,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: data.is24MesiReached ? 'var(--secondary)' : 'var(--on-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Award size={15} color={data.is24MesiReached ? 'var(--secondary)' : 'var(--on-surface-variant)'} />
            <span>24 Mesi ATA: {data.totalStataleDays}/716 gg ({data.percent24Mesi}%)</span>
          </div>

          {data.naspiDaysRemaining !== null && (
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                background: data.naspiDaysRemaining <= 10 ? 'var(--error-container)' : 'var(--primary-container)',
                border: `1.5px solid ${data.naspiDaysRemaining <= 10 ? 'var(--error)' : 'var(--outline-variant)'}`,
                fontSize: '0.8rem',
                fontWeight: 700,
                color: data.naspiDaysRemaining <= 10 ? 'var(--error)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Hourglass size={15} color={data.naspiDaysRemaining <= 10 ? 'var(--error)' : 'var(--primary)'} />
              <span>NASpI INPS: {data.naspiDaysRemaining > 0 ? `${data.naspiDaysRemaining} gg rimasti` : 'Scaduto'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="timeline-cards-grid">
        {data.deadlines.map(dl => (
          <div key={dl.id} className={`timeline-card ${dl.urgency}`}>
            <div className="timeline-card-top">
              <div className="timeline-icon-box">{getIconForType(dl.type)}</div>
              <span className="timeline-badge-pill">{dl.badge}</span>
            </div>

            <h3 className="timeline-card-title">{dl.title}</h3>

            <div className="timeline-countdown-big">
              {dl.status === 'completed' ? (
                <>
                  <CheckCircle2 size={30} color="var(--secondary)" />
                  <span className="timeline-number-bold" style={{ fontSize: '1.4rem' }}>
                    Completato
                  </span>
                </>
              ) : dl.status === 'expired' ? (
                <span className="timeline-number-bold" style={{ fontSize: '1.4rem' }}>
                  Termine Decaduto
                </span>
              ) : (
                <>
                  <span className="timeline-number-bold">{dl.daysRemaining}</span>
                  <span className="timeline-unit-label">giorni rimanenti</span>
                </>
              )}
            </div>

            {dl.progressPercent !== undefined && (
              <div className="timeline-progress-track">
                <div className="timeline-progress-fill" style={{ width: `${dl.progressPercent}%` }} />
              </div>
            )}

            <div className="timeline-card-desc">{dl.description}</div>

            {dl.targetDate && (
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: 8 }}>
                📅 Data di riferimento: <strong style={{ color: 'var(--on-surface)' }}>{formatDateItalian(dl.targetDate)}</strong>
              </div>
            )}

            <div className="timeline-card-action">
              <strong>💡 Azione consigliata:</strong> {dl.actionNote}
            </div>

            <div className="timeline-card-legal">
              <Scale size={12} />
              <span>{dl.legalReference}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Step-by-Step Milestones Track */}
      <div className="timeline-track-section">
        <div className="timeline-track-title">
          <CalendarRange size={18} color="var(--primary)" />
          <span>Percorso Cronologico delle Tappe di Carriera</span>
        </div>

        <div className="timeline-steps-flow">
          <div className="timeline-step-node">
            <div className="timeline-step-dot completed">✓</div>
            <div className="timeline-step-label">Terza Fascia ATA</div>
            <div className="timeline-step-sub">D.M. 89/2024 (Inizio)</div>
          </div>

          <div className="timeline-step-node">
            <div className={`timeline-step-dot ${data.is24MesiReached ? 'completed' : 'active'}`}>
              {data.is24MesiReached ? '✓' : `${data.percent24Mesi}%`}
            </div>
            <div className="timeline-step-label">716 Giorni Statali</div>
            <div className="timeline-step-sub">
              {data.is24MesiReached ? 'Requisito 24 Mesi Raggiunto' : `${data.daysTo24Mesi} gg mancanti`}
            </div>
          </div>

          <div className="timeline-step-node">
            <div className={`timeline-step-dot ${data.is24MesiReached ? 'completed' : 'future'}`}>
              {data.is24MesiReached ? '1ª' : '3ª'}
            </div>
            <div className="timeline-step-label">Graduatoria 24 Mesi</div>
            <div className="timeline-step-sub">Accesso Ruoli & Supplenze Annuali</div>
          </div>

          <div className="timeline-step-node">
            <div className={`timeline-step-dot ${data.activeContract ? 'completed' : 'future'}`}>
              {data.activeContract ? (data.activeContract.daysRemaining === 0 ? '✓' : `${data.activeContract.daysRemaining}g`) : '🏖️'}
            </div>
            <div className="timeline-step-label">Termine Servizio Attuale</div>
            <div className="timeline-step-sub">
              {data.activeContract
                ? data.activeContract.endDate === 'In corso'
                  ? 'In corso a tempo indeterminato'
                  : `Scadenza ${formatDateItalian(data.activeContract.endDate)}`
                : 'Nessun contratto in corso'}
            </div>
          </div>

          <div className="timeline-step-node">
            <div className={`timeline-step-dot ${data.naspiWindowOpen ? 'active' : 'future'}`}>
              {data.naspiDaysRemaining !== null && data.naspiDaysRemaining > 0 ? `${data.naspiDaysRemaining}g` : 'INPS'}
            </div>
            <div className="timeline-step-label">Finestra 68 gg NASpI</div>
            <div className="timeline-step-sub">
              {data.naspiDaysRemaining !== null && data.naspiDaysRemaining > 0
                ? `${data.naspiDaysRemaining} gg alla decadenza`
                : 'Indennità di Disoccupazione'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
