import { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  GraduationCap,
  Award,
  Briefcase,
  Users2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Person } from '../../shared/types';
import { call } from '../../shared/api';
import { useT } from '../../shared/i18n';
import type { DirectoryEntry } from '../directory/DirectoryPicker';
import { WizardServiceItem, FirstSetupWizardProps } from './types';
import { persistWizardProfile } from './wizardPersistence';
import { WizardStepWelcome } from './WizardStepWelcome';
import { WizardStepAnagrafica } from './WizardStepAnagrafica';
import { WizardStepProfiles } from './WizardStepProfiles';
import { WizardStepAccessTitle } from './WizardStepAccessTitle';
import { WizardStepQualifications } from './WizardStepQualifications';
import { WizardStepServices } from './WizardStepServices';
import { WizardStepFamily } from './WizardStepFamily';
import { WizardStepSummary } from './WizardStepSummary';
import './FirstSetupWizard.css';

const WIZARD_STEPS = [
  { id: 1, title: 'Benvenuto ATA', icon: Sparkles },
  { id: 2, title: 'Anagrafica', icon: User },
  { id: 3, title: 'Profilo Scelto', icon: Briefcase },
  { id: 4, title: 'Titolo di Accesso', icon: GraduationCap },
  { id: 5, title: 'CIAD & Certificazioni', icon: Award },
  { id: 6, title: 'Servizio Lavorativo', icon: Clock },
  { id: 7, title: 'Famiglia & Riserve', icon: Users2 },
  { id: 8, title: 'Riepilogo Punteggio', icon: CheckCircle2 },
];

export function FirstSetupWizard({
  person,
  onComplete,
  onCancel,
  busy,
}: FirstSetupWizardProps) {
  const t = useT();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2: Anagrafica
  const [lastName, setLastName] = useState(person?.lastName || '');
  const [firstName, setFirstName] = useState(person?.firstName || '');
  const [gender, setGender] = useState(person?.gender || 'female');
  const [birthDate, setBirthDate] = useState(person?.birthDate || '');
  const [birthPlace, setBirthPlace] = useState(person?.birthPlace || '');
  const [birthProvince, setBirthProvince] = useState(person?.birthProvince || '');
  const [fiscalCode, setFiscalCode] = useState(person?.fiscalCode || '');

  // Municipality autocomplete
  const [muniQuery, setMuniQuery] = useState(birthPlace);
  const [muniResults, setMuniResults] = useState<DirectoryEntry[]>([]);
  const [showMuniDropdown, setShowMuniDropdown] = useState(false);

  // Step 3: Profilo ATA scelto
  const [selectedProfile, setSelectedProfile] = useState<string>(person?.profile || 'CS');

  // Step 4: Titolo d'Accesso
  const [accessTitleName, setAccessTitleName] = useState('Diploma di Maturità Quinquennale');
  const [accessSchool, setAccessSchool] = useState('');
  const [accessYear, setAccessYear] = useState('');
  const [scoreBase, setScoreBase] = useState<number>(100);
  const [scoreAchieved, setScoreAchieved] = useState<number>(80);
  const [hasHonors, setHasHonors] = useState(false);

  // Step 5: CIAD & Titoli Culturali
  const [hasCiad, setHasCiad] = useState(true);
  const [hasDigitalCert, setHasDigitalCert] = useState(false);
  const [hasTypingCourse, setHasTypingCourse] = useState(false);
  const [hasDegree, setHasDegree] = useState(false);
  const [hasPublicContest, setHasPublicContest] = useState(false);

  // Step 6: Servizio
  const [services, setServices] = useState<WizardServiceItem[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newIsStatale, setNewIsStatale] = useState(true);
  const [newServiceProfile, setNewServiceProfile] = useState('CS');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // Step 7: Famiglia e Riserve
  const [hasSpouse, setHasSpouse] = useState(false);
  const [spouseName, setSpouseName] = useState('');
  const [spouseBirthDate, setSpouseBirthDate] = useState('');
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childrenUnder12, setChildrenUnder12] = useState<number>(0);
  const [hasLaw68, setHasLaw68] = useState(false);
  const [hasMilitaryReserve, setHasMilitaryReserve] = useState(false);

  // Error / status
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Municipality search
  useEffect(() => {
    let active = true;
    if (muniQuery.trim().length < 2 || !showMuniDropdown) {
      setMuniResults([]);
      return;
    }
    const timer = setTimeout(() => {
      call<DirectoryEntry[]>('search_directory', {
        kind: 'municipality',
        query: muniQuery.trim(),
      })
        .then(res => {
          if (active) setMuniResults(res.slice(0, 8));
        })
        .catch(() => {
          if (active) setMuniResults([]);
        });
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [muniQuery, showMuniDropdown]);

  // Scores
  const computedAccessScore = Math.min(
    10,
    Math.max(0, Number(((scoreAchieved / (scoreBase || 100)) * 10).toFixed(2))),
  );

  let computedCulturalScore = 0;
  if (hasDigitalCert) computedCulturalScore += selectedProfile === 'CS' ? 0.3 : 0.6;
  if (hasTypingCourse && selectedProfile === 'AA') computedCulturalScore += 1.0;
  if (hasDegree) computedCulturalScore += 2.0;
  if (hasPublicContest) computedCulturalScore += 1.0;
  computedCulturalScore = Number(computedCulturalScore.toFixed(2));

  const computedServiceScore = Number(
    services.reduce((acc, curr) => acc + curr.pointsCalculated, 0).toFixed(2),
  );

  const totalScore = Number(
    (computedAccessScore + computedCulturalScore + computedServiceScore).toFixed(2),
  );

  const handleAddService = () => {
    if (!newStartDate || !newEndDate) {
      setErrorMsg('Inserisci sia data di inizio che data di fine del contratto.');
      return;
    }
    const d1 = new Date(newStartDate);
    const d2 = new Date(newEndDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) {
      setErrorMsg('La data di fine deve essere successiva alla data di inizio.');
      return;
    }

    const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let fullMonths = Math.floor(diffDays / 30);
    const leftoverDays = diffDays % 30;
    if (leftoverDays >= 16) fullMonths += 1;
    const cappedMonths = Math.min(12, Math.max(1, fullMonths));

    const isSpecific = newServiceProfile === selectedProfile;
    let baseRate = selectedProfile === 'CS' ? 0.5 : 0.6;
    if (!isSpecific) baseRate *= 0.5;
    if (!newIsStatale) baseRate *= 0.5;

    const points = Number((cappedMonths * baseRate).toFixed(2));

    const item: WizardServiceItem = {
      id: crypto.randomUUID(),
      schoolName: newSchoolName.trim() || (newIsStatale ? 'I.C. Statale' : 'Scuola Paritaria'),
      isStatale: newIsStatale,
      profile: newServiceProfile,
      start: newStartDate,
      end: newEndDate,
      monthsCalculated: cappedMonths,
      pointsCalculated: points,
    };

    setServices([...services, item]);
    setNewSchoolName('');
    setNewStartDate('');
    setNewEndDate('');
    setErrorMsg('');
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const canProceed = () => {
    if (currentStep === 2) {
      return (
        lastName.trim().length > 0 &&
        firstName.trim().length > 0 &&
        fiscalCode.trim().length === 16
      );
    }
    if (currentStep === 4) {
      return scoreAchieved > 0 && scoreBase > 0 && scoreAchieved <= scoreBase;
    }
    return true;
  };

  const handleFinalSave = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { person: savedPerson, archive: updatedArchive } = await persistWizardProfile({
        personId: person?.id,
        lastName,
        firstName,
        gender,
        birthDate,
        birthPlace,
        birthProvince,
        fiscalCode,
        selectedProfile,
        accessTitleName,
        accessSchool,
        accessYear,
        scoreBase,
        scoreAchieved,
        hasHonors,
        computedAccessScore,
        hasCiad,
        hasDigitalCert,
        hasTypingCourse,
        hasDegree,
        services,
        hasSpouse,
        spouseName,
        spouseBirthDate,
        childrenCount,
        childrenUnder12,
      });

      onComplete(savedPerson, updatedArchive);
    } catch (e) {
      setErrorMsg(typeof e === 'string' ? e : 'Errore durante il salvataggio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true">
      <div className="wizard-container">
        {/* HEADER */}
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
              const Icon = s.icon;
              const isActive = currentStep === s.id;
              const isDone = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  className={`wizard-step-node ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                  onClick={() => s.id < currentStep && setCurrentStep(s.id)}
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

        {/* BODY */}
        <div className="wizard-body">
          {errorMsg && (
            <div role="alert" className="wizard-info-callout warning" style={{ marginBottom: 18 }}>
              <AlertCircle size={20} />
              <div>
                <h4>Attenzione</h4>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {currentStep === 1 && <WizardStepWelcome />}

          {currentStep === 2 && (
            <WizardStepAnagrafica
              lastName={lastName}
              setLastName={setLastName}
              firstName={firstName}
              setFirstName={setFirstName}
              gender={gender}
              setGender={setGender}
              birthDate={birthDate}
              setBirthDate={setBirthDate}
              birthPlace={birthPlace}
              setBirthPlace={setBirthPlace}
              birthProvince={birthProvince}
              setBirthProvince={setBirthProvince}
              fiscalCode={fiscalCode}
              setFiscalCode={setFiscalCode}
              muniQuery={muniQuery}
              setMuniQuery={setMuniQuery}
              muniResults={muniResults}
              showMuniDropdown={showMuniDropdown}
              setShowMuniDropdown={setShowMuniDropdown}
            />
          )}

          {currentStep === 3 && (
            <WizardStepProfiles
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
            />
          )}

          {currentStep === 4 && (
            <WizardStepAccessTitle
              accessTitleName={accessTitleName}
              setAccessTitleName={setAccessTitleName}
              accessSchool={accessSchool}
              setAccessSchool={setAccessSchool}
              accessYear={accessYear}
              setAccessYear={setAccessYear}
              scoreBase={scoreBase}
              setScoreBase={setScoreBase}
              scoreAchieved={scoreAchieved}
              setScoreAchieved={setScoreAchieved}
              hasHonors={hasHonors}
              setHasHonors={setHasHonors}
              computedAccessScore={computedAccessScore}
            />
          )}

          {currentStep === 5 && (
            <WizardStepQualifications
              selectedProfile={selectedProfile}
              hasCiad={hasCiad}
              setHasCiad={setHasCiad}
              hasDigitalCert={hasDigitalCert}
              setHasDigitalCert={setHasDigitalCert}
              hasTypingCourse={hasTypingCourse}
              setHasTypingCourse={setHasTypingCourse}
              hasDegree={hasDegree}
              setHasDegree={setHasDegree}
              hasPublicContest={hasPublicContest}
              setHasPublicContest={setHasPublicContest}
              computedCulturalScore={computedCulturalScore}
            />
          )}

          {currentStep === 6 && (
            <WizardStepServices
              services={services}
              selectedProfile={selectedProfile}
              newSchoolName={newSchoolName}
              setNewSchoolName={setNewSchoolName}
              newIsStatale={newIsStatale}
              setNewIsStatale={setNewIsStatale}
              newServiceProfile={newServiceProfile}
              setNewServiceProfile={setNewServiceProfile}
              newStartDate={newStartDate}
              setNewStartDate={setNewStartDate}
              newEndDate={newEndDate}
              setNewEndDate={setNewEndDate}
              handleAddService={handleAddService}
              handleRemoveService={handleRemoveService}
              computedServiceScore={computedServiceScore}
            />
          )}

          {currentStep === 7 && (
            <WizardStepFamily
              hasSpouse={hasSpouse}
              setHasSpouse={setHasSpouse}
              spouseName={spouseName}
              setSpouseName={setSpouseName}
              spouseBirthDate={spouseBirthDate}
              setSpouseBirthDate={setSpouseBirthDate}
              childrenCount={childrenCount}
              setChildrenCount={setChildrenCount}
              childrenUnder12={childrenUnder12}
              setChildrenUnder12={setChildrenUnder12}
              hasLaw68={hasLaw68}
              setHasLaw68={setHasLaw68}
              hasMilitaryReserve={hasMilitaryReserve}
              setHasMilitaryReserve={setHasMilitaryReserve}
            />
          )}

          {currentStep === 8 && (
            <WizardStepSummary
              lastName={lastName}
              firstName={firstName}
              fiscalCode={fiscalCode}
              birthDate={birthDate}
              birthPlace={birthPlace}
              birthProvince={birthProvince}
              selectedProfile={selectedProfile}
              accessTitleName={accessTitleName}
              scoreAchieved={scoreAchieved}
              scoreBase={scoreBase}
              computedAccessScore={computedAccessScore}
              hasCiad={hasCiad}
              hasDigitalCert={hasDigitalCert}
              hasTypingCourse={hasTypingCourse}
              hasDegree={hasDegree}
              computedCulturalScore={computedCulturalScore}
              services={services}
              computedServiceScore={computedServiceScore}
              totalScore={totalScore}
              hasSpouse={hasSpouse}
              spouseName={spouseName}
              childrenCount={childrenCount}
              childrenUnder12={childrenUnder12}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="wizard-footer">
          <div className="wizard-footer-left">
            {currentStep > 1 && (
              <button
                type="button"
                className="wizard-btn-prev"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ArrowLeft size={16} /> Precedente
              </button>
            )}
          </div>

          <div>
            {currentStep < 8 ? (
              <button
                type="button"
                className="wizard-btn-next"
                onClick={() => canProceed() && setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Continua <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="wizard-btn-finish"
                disabled={isSubmitting || busy}
                onClick={() => void handleFinalSave()}
              >
                <CheckCircle2 size={18} />
                {isSubmitting ? 'Salvataggio in corso...' : 'Salva e Completa Configurazione'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
