import {
  Sparkles,
  User,
  GraduationCap,
  Award,
  Briefcase,
  Users2,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react';
import { useT } from '../../shared/i18n';

export const WIZARD_STEPS = [
  { id: 1, title: 'Benvenuto ATA', icon: Sparkles },
  { id: 2, title: 'Anagrafica', icon: User },
  { id: 3, title: 'Profilo Scelto', icon: Briefcase },
  { id: 4, title: 'Titolo di Accesso', icon: GraduationCap },
  { id: 5, title: 'CIAD & Certificazioni', icon: Award },
  { id: 6, title: 'Servizio Lavorativo', icon: Clock },
  { id: 7, title: 'Famiglia & Riserve', icon: Users2 },
  { id: 8, title: 'Riepilogo Punteggio', icon: CheckCircle2 },
];

export interface WizardStepperBarProps {
  currentStep: number;
  onSelectStep: (stepId: number) => void;
  onCancel: () => void;
}

export function WizardStepperBar({
  currentStep,
  onSelectStep,
  onCancel,
}: WizardStepperBarProps) {
  const t = useT();

  return (
    <div className="wizard-header">
      <div className="wizard-top-bar">
        <span className="wizard-brand-badge">
          <Sparkles size={14} />
          Configurazione Assistita dalla A alla Z
        </span>
        <button className="wizard-close-btn" onClick={onCancel} title={t('cancel')}>
          <X size={20} />
        </button>
      </div>

      <div className="wizard-stepper" role="tablist">
        {WIZARD_STEPS.map(s => {
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          return (
            <button
              key={s.id}
              className={`wizard-step-node ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
              onClick={() => s.id < currentStep && onSelectStep(s.id)}
              disabled={s.id > currentStep}
              type="button"
            >
              <span className="wizard-step-num">
                {isDone ? <CheckCircle2 size={16} /> : s.id}
              </span>
              <span className="wizard-step-label">{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
