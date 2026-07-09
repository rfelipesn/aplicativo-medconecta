import type { SeizureDraft } from '../types';

export interface StepProps {
  draft: SeizureDraft;
  update: (patch: Partial<SeizureDraft>) => void;
}
