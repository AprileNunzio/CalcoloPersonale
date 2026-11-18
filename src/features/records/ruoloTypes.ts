import type { DirectoryEntry } from '../directory/DirectoryPicker';

export type RuoloMobilityType =
  | 'titolarita'
  | 'trasferimento'
  | 'assegnazione_provvisoria'
  | 'utilizzazione'
  | 'anno_prova';

export type AssegnazioneProvvisoriaReason =
  | 'ricongiungimento_figli_under_6'
  | 'ricongiungimento_figli_under_12'
  | 'ricongiungimento_coniuge'
  | 'salute_assistenza_104'
  | 'gravi_motivi_salute'
  | 'altro';

export interface RuoloDetailsPayload {
  isRuolo?: boolean;
  ruoloDate?: string;
  ruoloEconomicDate?: string;
  ruoloAmbito?: string;
  ruoloMobility?: RuoloMobilityType;
  titolaritaSchool?: DirectoryEntry | null;
  continuityYears?: number;
  superamentoAnnoProva?: boolean;
  motivoAssegnazione?: AssegnazioneProvvisoriaReason;
  transferType?: 'volontario' | 'ufficio_soprannumerario';
  previousSchoolName?: string;
}

export const RUOLO_MOBILITY_OPTIONS: {
  value: RuoloMobilityType;
  label: string;
  description: string;
  iconName: string;
  color: string;
}[] = [
  {
    value: 'titolarita',
    label: 'Scuola di Titolarità',
    description: 'Servizio prestato nella scuola di titolarità organica',
    iconName: 'Building2',
    color: 'var(--primary)',
  },
  {
    value: 'trasferimento',
    label: 'Trasferimento',
    description: 'Movimento di mobilità territoriale volontaria o d’ufficio',
    iconName: 'Repeat',
    color: 'var(--primary)',
  },
  {
    value: 'assegnazione_provvisoria',
    label: 'Assegnazione Provvisoria',
    description: 'Movimento annuale provinciale o interprovinciale (es. ricongiungimento)',
    iconName: 'Navigation',
    color: 'var(--secondary)',
  },
  {
    value: 'utilizzazione',
    label: 'Utilizzazione',
    description: 'Assegnazione annuale per esubero o progetti di potenziamento',
    iconName: 'Layers',
    color: 'var(--tertiary)',
  },
  {
    value: 'anno_prova',
    label: 'Anno di Prova',
    description: 'Anno di formazione e prova per la conferma definitiva in ruolo',
    iconName: 'GraduationCap',
    color: 'var(--secondary)',
  },
];

export const ASSEGNAZIONE_REASONS: { value: AssegnazioneProvvisoriaReason; label: string }[] = [
  { value: 'ricongiungimento_figli_under_6', label: 'Ricongiungimento ai figli di età inferiore a 6 anni (Priorità 1)' },
  { value: 'ricongiungimento_figli_under_12', label: 'Ricongiungimento ai figli di età tra 6 e 12 anni' },
  { value: 'ricongiungimento_coniuge', label: 'Ricongiungimento al coniuge / convivente' },
  { value: 'salute_assistenza_104', label: 'Assistenza disabile grave (Art. 3 c. 3 L. 104/92)' },
  { value: 'gravi_motivi_salute', label: 'Gravi esigenze di salute del dipendente' },
  { value: 'altro', label: 'Altre motivazioni documentate' },
];
