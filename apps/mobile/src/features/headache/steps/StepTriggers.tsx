import { ScrollView, StyleSheet, View } from 'react-native';
import { HEADACHE_DEFAULT_TRIGGERS } from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { ActionPills } from '../components/ActionPills';
import { SelectableList } from '../components/SelectableList';
import { toggle } from '../utils';
import type { StepProps } from './common';

export function StepTriggers({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle
        before="Você sabe o que pode ter "
        highlight="desencadeado"
        after=" a crise?"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ActionPills onAdd={() => undefined} />
        <SelectableList
          options={HEADACHE_DEFAULT_TRIGGERS}
          selected={draft.triggers}
          onToggle={(v) => update({ triggers: toggle(draft.triggers, v) })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
