/** Definição dos 6 passos do wizard de convulsão (ordem, rótulo e ícone do stepper). */
export interface WizardStepDef {
  key: string;
  label: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { key: 'date', label: 'Data', icon: '📅' },
  { key: 'duration', label: 'Duraç.', icon: '🕐' },
  { key: 'consciousness', label: 'Consci.', icon: '🧠' },
  { key: 'hospital', label: 'Hospital', icon: '🏥' },
  { key: 'medication', label: 'Meds', icon: '💊' },
  { key: 'notes', label: 'Anotaç.', icon: '✏️' },
];

export const STEP_COUNT = WIZARD_STEPS.length;
