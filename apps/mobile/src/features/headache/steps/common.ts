import type { CrisisDraft } from '../types';

export interface StepProps {
  draft: CrisisDraft;
  update: (patch: Partial<CrisisDraft>) => void;
}
