/** Definição dos 11 passos do wizard (ordem, rótulo e ícone do stepper). */
export interface WizardStepDef {
  key: string;
  label: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { key: 'date', label: 'Data', icon: '📅' },
  { key: 'duration', label: 'Duraç.', icon: '🕐' },
  { key: 'intensity', label: 'Intens.', icon: '📊' },
  { key: 'type', label: 'Tipo', icon: '⚡' },
  { key: 'location', label: 'Local.', icon: '🧑' },
  { key: 'symptoms', label: 'Sint.', icon: '🧠' },
  { key: 'triggers', label: 'Gatilh.', icon: '🎯' },
  { key: 'medications', label: 'Meds', icon: '💊' },
  { key: 'relief', label: 'Alívio', icon: '🌸' },
  { key: 'disability', label: 'Incap.', icon: '🏃' },
  { key: 'notes', label: 'Anotaç.', icon: '✏️' },
];

export const STEP_COUNT = WIZARD_STEPS.length;
