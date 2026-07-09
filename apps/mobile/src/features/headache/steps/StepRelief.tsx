import { ScrollView, StyleSheet, View } from 'react-native';
import { HEADACHE_DEFAULT_RELIEF } from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { ActionPills } from '../components/ActionPills';
import { SelectableList } from '../components/SelectableList';
import { toggle } from '../utils';
import type { StepProps } from './common';

export function StepRelief({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Quais métodos de " highlight="alívio" after=" você tentou?" />
      <ScrollView contentContainerStyle={styles.content}>
        <ActionPills onAdd={() => undefined} />
        <SelectableList
          options={HEADACHE_DEFAULT_RELIEF}
          selected={draft.reliefMethods}
          onToggle={(v) => update({ reliefMethods: toggle(draft.reliefMethods, v) })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
