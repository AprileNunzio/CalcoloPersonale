import { CheckCircle2 } from 'lucide-react';
import { ProfileBadge3d } from '../../shared/icons3d';

const PROFILES_LIST = [
  {
    code: 'CS',
    title: 'Collaboratore Scolastico',
    desc: 'Accoglienza e sorveglianza degli alunni, pulizia e custodia dei locali scolastici, ausilio materiale agli alunni disabili.',
    req: 'Diploma di maturità o qualifica triennale (CIAD non obbligatoria).',
    highlight: 'Profilo con maggior numero di posti disponibili.',
  },
  {
    code: 'AA',
    title: 'Assistente Amministrativo',
    desc: 'Lavoro d’ufficio e segreteria: gestione contratti, protocollo, fascicoli alunni e personale, contabilità e acquisti SIDI.',
    req: 'Diploma di maturità (qualsiasi indirizzo) + CIAD obbligatoria.',
    highlight: 'Dattilografia assegna +1.00 punto intero.',
  },
  {
    code: 'AT',
    title: 'Assistente Tecnico',
    desc: 'Supporto tecnico e didattico nei laboratori delle scuole secondarie superiori (informatica, meccanica, chimica, scienze).',
    req: 'Diploma specifico corrispondente all’area di laboratorio + CIAD.',
    highlight: 'Conduzione e manutenzione tecnica laboratori.',
  },
  {
    code: 'OS',
    title: 'Operatore Scolastico',
    desc: 'Nuova area del CCNL 2024: assistenza specialistica agli alunni con disabilità, igiene personale e primo soccorso.',
    req: 'Attestato di qualifica OSS / OSA + CIAD obbligatoria.',
    highlight: 'Supporto diretto all’inclusione.',
  },
  {
    code: 'CU',
    title: 'Cuoco',
    desc: 'Preparazione dei pasti nelle mense di convitti, educandati e istituti speciali.',
    req: 'Qualifica professionale specifica per la ristorazione.',
    highlight: 'Istituti alberghieri ed educandati.',
  },
  {
    code: 'GA',
    title: 'Guardarobiere',
    desc: 'Custodia, cura e lavaggio del vestiario e della biancheria nei convitti scolastici.',
    req: 'Qualifica professionale specifica.',
    highlight: 'Convitti ed educandati.',
  },
];

export function WizardStepProfiles({
  selectedProfile,
  setSelectedProfile,
}: {
  selectedProfile: string;
  setSelectedProfile: (p: string) => void;
}) {
  return (
    <div className="wizard-step-content">
      <div style={{ marginBottom: 16 }}>
        <h2>Scegli il Profilo ATA di Riferimento</h2>
        <p className="muted">
          Ogni profilo professionale ha compiti specifici, requisiti minimi d'accesso stabiliti dal CCNL e tabelle di valutazione titoli dedicate.
        </p>
      </div>

      <div className="wizard-profiles-grid">
        {PROFILES_LIST.map(p => (
          <div
            key={p.code}
            className={`wizard-profile-card ${selectedProfile === p.code ? 'selected' : ''}`}
            onClick={() => setSelectedProfile(p.code)}
          >
            <div className="wizard-profile-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ProfileBadge3d code={p.code} size={30} />
                <span className="wizard-profile-code-badge">{p.code}</span>
              </div>
              {selectedProfile === p.code && (
                <CheckCircle2 size={20} color="var(--primary)" />
              )}
            </div>
            <h3 className="wizard-profile-title">{p.title}</h3>
            <p className="wizard-profile-desc">{p.desc}</p>
            <span className="wizard-profile-badge-tag">{p.req}</span>
            <small style={{ fontSize: 11, color: 'var(--secondary)', fontWeight: 600 }}>{p.highlight}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
