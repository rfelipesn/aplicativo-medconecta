import { ScrollView, StyleSheet, View } from 'react-native';
import { HEADACHE_DEFAULT_SYMPTOMS } from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { ActionPills } from '../components/ActionPills';
import { SelectableList } from '../components/SelectableList';
import { toggle } from '../utils';
import type { StepProps } from './common';

export function StepSymptoms({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Quais são seus sintomas?" />
      <ScrollView contentContainerStyle={styles.content}>
        <ActionPills onAdd={() => undefined} />
        <SelectableList
          options={HEADACHE_DEFAULT_SYMPTOMS}
          selected={draft.symptoms}
          onToggle={(v) => update({ symptoms: toggle(draft.symptoms, v) })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
