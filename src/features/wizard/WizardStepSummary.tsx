import { Heart, Baby } from 'lucide-react';
import { ProfileBadge3d } from '../../shared/icons3d';
import { PROFILE_LABELS } from '../../shared/personUtils';
import { WizardServiceItem } from './types';

interface WizardStepSummaryProps {
  lastName: string;
  firstName: string;
  fiscalCode: string;
  birthDate: string;
  birthPlace: string;
  birthProvince: string;
  selectedProfile: string;
  accessTitleName: string;
  scoreAchieved: number;
  scoreBase: number;
  computedAccessScore: number;
  hasCiad: boolean;
  hasDigitalCert: boolean;
  hasTypingCourse: boolean;
  hasDegree: boolean;
  computedCulturalScore: number;
  services: WizardServiceItem[];
  computedServiceScore: number;
  totalScore: number;
  hasSpouse: boolean;
  spouseName: string;
  childrenCount: number;
  childrenUnder12: number;
}

export function WizardStepSummary({
  lastName,
  firstName,
  fiscalCode,
  birthDate,
  birthPlace,
  birthProvince,
  selectedProfile,
  accessTitleName,
  scoreAchieved,
  scoreBase,
  computedAccessScore,
  hasCiad,
  hasDigitalCert,
  hasTypingCourse,
  hasDegree,
  computedCulturalScore,
  services,
  computedServiceScore,
  totalScore,
  hasSpouse,
  spouseName,
  childrenCount,
  childrenUnder12,
}: WizardStepSummaryProps) {
  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 18 }}>
        <h2>Riepilogo Generale & Simulazione del Punteggio</h2>
        <p className="muted">
          Controlla i dati della tua compilazione. Il punteggio finale stimato per la Terza Fascia ATA è calcolato con precisione matematica.
        </p>
      </div>

      {/* CANDIDATE RECAP CARD */}
      <div className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e6f4f1', color: '#116b62', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {lastName.charAt(0)}{firstName.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{lastName} {firstName}</h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                CF: {fiscalCode} · Nato/a il {birthDate || '—'} a {birthPlace} ({birthProvince})
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ProfileBadge3d code={selectedProfile} size={28} />
            <span className="badge" style={{ fontSize: 13, fontWeight: 700 }}>
              Profilo: {selectedProfile} · {PROFILE_LABELS[selectedProfile] || selectedProfile}
            </span>
          </div>
        </div>
      </div>

      {/* SCORE BREAKDOWN TABLE */}
      <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 15 }}>Dettaglio Punteggio Ministeriale Graduatoria</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #edf2f0' }}>
            <div>
              <strong>Titolo di Studio di Accesso</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {accessTitleName} ({scoreAchieved}/{scoreBase}) → formula <code>({scoreAchieved}/{scoreBase}) × 10</code>
              </div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#116b62' }}>{computedAccessScore} pt</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #edf2f0' }}>
            <div>
              <strong>Titoli Culturali e Certificazioni Informatiche</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {[
                  hasCiad ? 'CIAD (Accredia)' : null,
                  hasDigitalCert ? `Cert. Informatica (+${selectedProfile === 'CS' ? '0.30' : '0.60'})` : null,
                  hasTypingCourse ? 'Dattilografia (+1.00)' : null,
                  hasDegree ? 'Laurea (+2.00)' : null,
                ].filter(Boolean).join(', ') || 'Nessun titolo aggiuntivo'}
              </div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#116b62' }}>+{computedCulturalScore} pt</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #edf2f0' }}>
            <div>
              <strong>Servizio Lavorativo Scolastico</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {services.length} {services.length === 1 ? 'periodo documentato' : 'periodi documentati'} (regola dei 16 giorni applicata)
              </div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#116b62' }}>+{computedServiceScore} pt</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
            <div>
              <strong style={{ fontSize: 17, color: '#116b62' }}>PUNTEGGIO TOTALE STIMATO</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Valido per l’inserimento nelle Graduatorie di Terza Fascia ATA
              </div>
            </div>
            <strong style={{ fontSize: 24, fontWeight: 800, color: '#116b62' }}>
              {totalScore} punti
            </strong>
          </div>
        </div>
      </div>

      {/* FAMILY & PREFERENCES SUMMARY */}
      <div className="dash-cards-grid">
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Heart size={18} color="#e11d48" />
            <strong>Coniuge e Ricongiungimento</strong>
          </div>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            {hasSpouse
              ? `${spouseName} (registrato/a) · Diritto a +6 punti ricongiungimento mobilità comunale e 15 gg congedo matrimoniale.`
              : 'Nessun coniuge registrato.'}
          </p>
        </div>

        <div className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Baby size={18} color="#2563eb" />
            <strong>Figli e Precedenze</strong>
          </div>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            {childrenCount > 0
              ? `${childrenCount} figli a carico (precedenza a parità di punteggio) · ${childrenUnder12} con congedo parentale attivo (< 12 anni).`
              : 'Nessun figlio a carico registrato.'}
          </p>
        </div>
      </div>
    </div>
  );
}
