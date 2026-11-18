import { useState } from 'react';
import {
  AlertTriangle,
  Scale,
  CheckCircle2,
  Calendar,
  AlertOctagon,
  Info,
  CalendarRange,
} from 'lucide-react';
import type { Person } from '../../shared/types';
import { analyzeAranAbsenceSequences, type AranAlert } from './aranRules';
import { formatDateItalian } from '../../shared/dateUtils';
import './aranAlerts.css';

interface AranCompliancePanelProps {
  person: Person;
}

export function AranCompliancePanel({ person }: AranCompliancePanelProps) {
  const [daysPerWeek, setDaysPerWeek] = useState<5 | 6>(5);

  const alerts = analyzeAranAbsenceSequences(person.records || [], { daysPerWeek });

  return (
    <div className="aran-compliance-container">
      <div className="aran-compliance-header">
        <div className="aran-header-title">
          <Scale size={20} color="var(--primary)" />
          <span>Monitoraggio Orientamenti Applicativi ARAN (Conteggio Weekend e Festivi)</span>
        </div>

        <div className="aran-schedule-toggle">
          <span style={{ fontSize: '0.74rem', color: 'var(--on-surface-variant)', marginRight: 4 }}>Orario di servizio:</span>
          <button
            type="button"
            className={`aran-schedule-btn ${daysPerWeek === 5 ? 'active' : ''}`}
            onClick={() => setDaysPerWeek(5)}
            title="Orario settimanale su 5 giorni lavorativi (lunedì-venerdì) con sabato non lavorativo"
          >
            Settimana Corta (5 gg)
          </button>
          <button
            type="button"
            className={`aran-schedule-btn ${daysPerWeek === 6 ? 'active' : ''}`}
            onClick={() => setDaysPerWeek(6)}
            title="Orario settimanale ordinario su 6 giorni lavorativi (lunedì-sabato)"
          >
            Settimana 6 gg
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--secondary)',
            fontSize: '0.85rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>
            <strong>Nessuna criticità ARAN rilevata</strong>: le assenze registrate non presentano sovrapposizioni o
            sequenze con addebito improprio di sabato e domenica (es. CIRS46 o CIRS36).
          </span>
        </div>
      ) : (
        alerts.map(al => {
          const isCritical = al.severity === 'critical_red';
          const isAmber = al.severity === 'warning_amber';

          const formattedDates = al.affectedDates.map(d => formatDateItalian(d, true)).join(' • ');

          return (
            <div key={al.id} className={`aran-alert-card ${al.severity}`}>
              <div className="aran-alert-top">
                <div className="aran-alert-badge">
                  {isCritical ? (
                    <AlertOctagon size={14} />
                  ) : isAmber ? (
                    <AlertTriangle size={14} />
                  ) : (
                    <Info size={14} />
                  )}
                  <span>{al.ruleCode}</span>
                </div>

                {al.affectedDates.length > 0 && (
                  <div className="aran-alert-dates-pill">
                    <CalendarRange size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: '-2px' }} />
                    <span>Giorni conteggiati: {formattedDates}</span>
                  </div>
                )}
              </div>

              <h4 className="aran-alert-heading">{al.title}</h4>
              <div className="aran-alert-summary">{al.summary}</div>

              <div className="aran-alert-interpretation">
                <div style={{ fontWeight: 700, color: 'var(--surface-container-high)', marginBottom: 4 }}>
                  ⚖️ Orientamento ARAN applicato: {al.legalReference}
                </div>
                {al.aranInterpretation}
              </div>

              <div className="aran-alert-consequence">
                <span>⚠️ {al.consequence}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
