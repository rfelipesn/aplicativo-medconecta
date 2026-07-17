/** Definição dos 11 passos do wizard (ordem e rótulo do stepper). */
export interface WizardStepDef {
  key: string;
  label: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { key: 'date', label: 'Data' },
  { key: 'duration', label: 'Duraç.' },
  { key: 'intensity', label: 'Intens.' },
  { key: 'type', label: 'Tipo' },
  { key: 'location', label: 'Local.' },
  { key: 'symptoms', label: 'Sint.' },
  { key: 'triggers', label: 'Gatilh.' },
  { key: 'medications', label: 'Meds' },
  { key: 'relief', label: 'Alívio' },
  { key: 'disability', label: 'Incap.' },
  { key: 'notes', label: 'Anotaç.' },
];

export const STEP_COUNT = WIZARD_STEPS.length;
