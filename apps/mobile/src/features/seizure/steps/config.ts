/** Definição dos 6 passos do wizard de convulsão (ordem e rótulo do stepper). */
export interface WizardStepDef {
  key: string;
  label: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { key: 'date', label: 'Data' },
  { key: 'duration', label: 'Duraç.' },
  { key: 'consciousness', label: 'Consci.' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'medication', label: 'Meds' },
  { key: 'notes', label: 'Anotaç.' },
];

export const STEP_COUNT = WIZARD_STEPS.length;
