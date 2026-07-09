import { ScrollView, StyleSheet, View } from 'react-native';
import { LOSSES_OF_CONSCIOUSNESS_OPTIONS } from '@medconecta/shared';
import { WizardTitle } from '../../headache/components/WizardTitle';
import { ToggleChoice, type ToggleOption } from '../components/ToggleChoice';
import type { StepProps } from './common';

const OPTIONS: ToggleOption[] = LOSSES_OF_CONSCIOUSNESS_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function StepConsciousness({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Houve " highlight="perda de consciência?" />
      <ScrollView contentContainerStyle={styles.content}>
        <ToggleChoice
          options={OPTIONS}
          selectedValue={draft.lossOfConsciousness}
          onSelect={(v) => update({ lossOfConsciousness: v })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
