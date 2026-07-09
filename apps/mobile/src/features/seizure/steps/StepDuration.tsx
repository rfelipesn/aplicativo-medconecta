import { ScrollView, StyleSheet, View } from 'react-native';
import { SEIZURE_DURATION_STEPS } from '@medconecta/shared';
import { WizardTitle } from '../../headache/components/WizardTitle';
import { ChipSelector, type ChipOption } from '../../headache/components/ChipSelector';
import type { StepProps } from './common';

const DURATION_CHIPS: ChipOption[] = SEIZURE_DURATION_STEPS.map((s, i) => ({
  id: String(i),
  label: s.label,
}));

export function StepDuration({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Quanto tempo " highlight="durou" after=" a crise?" />
      <ScrollView contentContainerStyle={styles.content}>
        <ChipSelector
          options={DURATION_CHIPS}
          selectedId={draft.durationStepIndex == null ? null : String(draft.durationStepIndex)}
          onSelect={(id) => update({ durationStepIndex: Number(id) })}
          columns={2}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
