import { Entry, Person, Archive } from '../../shared/types';
import { call, getRevision } from '../../shared/api';
import { flush } from '../autosave/store';
import { WizardServiceItem } from './types';

export interface WizardSaveData {
  personId?: string;
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  birthProvince: string;
  fiscalCode: string;
  selectedProfile: string;
  accessTitleName: string;
  accessSchool: string;
  accessYear: string;
  scoreBase: number;
  scoreAchieved: number;
  hasHonors: boolean;
  computedAccessScore: number;
  hasCiad: boolean;
  hasDigitalCert: boolean;
  hasTypingCourse: boolean;
  hasDegree: boolean;
  services: WizardServiceItem[];
  hasSpouse: boolean;
  spouseName: string;
  spouseBirthDate: string;
  childrenCount: number;
  childrenUnder12: number;
}

export async function persistWizardProfile(data: WizardSaveData): Promise<{ person: Person; archive: Archive }> {
  await flush();

  const personId = data.personId || crypto.randomUUID();
  const recordsToCreate: Entry[] = [];

  // A. Access Title
  recordsToCreate.push({
    id: crypto.randomUUID(),
    kind: 'qualification',
    title: `${data.accessTitleName} (${data.scoreAchieved}/${data.scoreBase}${data.hasHonors ? ' con Lode' : ''})`,
    start: data.accessYear ? `${data.accessYear}-07-01` : new Date().toISOString().slice(0, 10),
    end: null,
    amount: data.computedAccessScore,
    notes: JSON.stringify({
      isAccessTitle: true,
      school: data.accessSchool,
      scoreAchieved: data.scoreAchieved,
      scoreBase: data.scoreBase,
      hasHonors: data.hasHonors,
      calculatedPoints: data.computedAccessScore,
    }),
    profile: data.selectedProfile,
    school: null,
  });

  // B. Cultural Titles
  if (data.hasCiad) {
    recordsToCreate.push({
      id: crypto.randomUUID(),
      kind: 'qualification',
      title: 'Certificazione Internazionale di Alfabetizzazione Digitale (CIAD - Accredia)',
      start: new Date().toISOString().slice(0, 10),
      end: null,
      amount: 0,
      notes: JSON.stringify({ isCiad: true }),
      profile: data.selectedProfile,
      school: null,
    });
  }

  if (data.hasDigitalCert) {
    recordsToCreate.push({
      id: crypto.randomUUID(),
      kind: 'qualification',
      title: 'Certificazione Informatica aggiuntiva (EIPASS / ICDL / DigComp)',
      start: new Date().toISOString().slice(0, 10),
      end: null,
      amount: data.selectedProfile === 'CS' ? 0.3 : 0.6,
      notes: JSON.stringify({ kind: 'digital' }),
      profile: data.selectedProfile,
      school: null,
    });
  }

  if (data.hasTypingCourse && data.selectedProfile === 'AA') {
    recordsToCreate.push({
      id: crypto.randomUUID(),
      kind: 'qualification',
      title: 'Attestato di Addestramento Professionale per la Dattilografia',
      start: new Date().toISOString().slice(0, 10),
      end: null,
      amount: 1.0,
      notes: JSON.stringify({ kind: 'typing' }),
      profile: 'AA',
      school: null,
    });
  }

  if (data.hasDegree) {
    recordsToCreate.push({
      id: crypto.randomUUID(),
      kind: 'qualification',
      title: 'Diploma di Laurea (Triennale o Magistrale)',
      start: new Date().toISOString().slice(0, 10),
      end: null,
      amount: 2.0,
      notes: JSON.stringify({ kind: 'degree' }),
      profile: data.selectedProfile,
      school: null,
    });
  }

  // C. Services
  for (const s of data.services) {
    recordsToCreate.push({
      id: crypto.randomUUID(),
      kind: 'service',
      title: `${s.schoolName} (${s.isStatale ? 'Statale' : 'Paritaria'}) - Profilo ${s.profile}`,
      start: s.start,
      end: s.end,
      amount: s.pointsCalculated,
      notes: JSON.stringify({
        sector: s.isStatale ? 'state' : 'paritaria',
        isSpecific: s.profile === data.selectedProfile,
        monthsCalculated: s.monthsCalculated,
      }),
      profile: s.profile,
      school: null,
    });
  }

  // D. Spouse & Family
  if (data.hasSpouse && data.spouseName.trim()) {
    recordsToCreate.push({
      id: crypto.randomUUID(),
      kind: 'child',
      title: data.spouseName.trim(),
      start: data.spouseBirthDate || '1990-01-01',
      end: null,
      amount: 100,
      notes: JSON.stringify({
        relation: 'spouse',
        notesText: 'Coniuge / Partner registrato con procedura guidata.',
      }),
      profile: null,
      school: null,
    });
  }

  if (data.childrenCount > 0) {
    for (let i = 1; i <= data.childrenCount; i++) {
      const isUnder12Child = i <= data.childrenUnder12;
      const birthYear = isUnder12Child ? 2020 : 2008;
      recordsToCreate.push({
        id: crypto.randomUUID(),
        kind: 'child',
        title: `Figlio/a ${i}`,
        start: `${birthYear}-05-15`,
        end: null,
        amount: 100,
        notes: JSON.stringify({
          relation: 'child',
          notesText: isUnder12Child
            ? 'Figlio/a con congedo parentale attivo fino a 12 anni.'
            : 'Figlio/a (maggiore di 12 anni).',
        }),
        profile: null,
        school: null,
      });
    }
  }

  const builtPerson: Person = {
    id: personId,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    gender: data.gender,
    birthDate: data.birthDate || null,
    birthPlace: data.birthPlace.trim() || null,
    birthProvince: data.birthProvince.trim() || null,
    fiscalCode: data.fiscalCode.trim().toUpperCase(),
    profile: data.selectedProfile,
    records: recordsToCreate,
  };

  const updatedArchive = await call<Archive>('save_person', {
    person: builtPerson,
    revision: getRevision(),
  });

  return { person: builtPerson, archive: updatedArchive };
}
