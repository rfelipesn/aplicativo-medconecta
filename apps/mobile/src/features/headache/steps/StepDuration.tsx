import { View } from 'react-native';
import { WizardTitle } from '../components/WizardTitle';
import { DurationSlider } from '../components/DurationSlider';
import type { StepProps } from './common';

export function StepDuration({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Quanto tempo a dor durou?" />
      <DurationSlider
        index={draft.durationStepIndex ?? 0}
        onChange={(i) => update({ durationStepIndex: i })}
      />
    </View>
  );
}
