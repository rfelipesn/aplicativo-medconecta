import { ScrollView, StyleSheet, View } from 'react-native';
import { HEADACHE_COMMON_MEDICATIONS } from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { ActionPills } from '../components/ActionPills';
import { SectionHeader } from '../components/SectionHeader';
import { SelectableList } from '../components/SelectableList';
import { ListSelectItem } from '../components/ListSelectItem';
import { toggle } from '../utils';
import type { StepProps } from './common';

export function StepMedications({ draft, update }: StepProps) {
  // Medicamentos já selecionados que não estão na lista comum aparecem no topo.
  const customSelected = draft.medications.filter((m) => !HEADACHE_COMMON_MEDICATIONS.includes(m));

  return (
    <View style={{ flex: 1 }}>
      <WizardTitle
        before="Quais "
        highlight="medicamentos"
        after=" de crise você tomou?"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ActionPills onAdd={() => undefined} />

        {customSelected.length > 0 &&
          customSelected.map((m) => (
            <ListSelectItem
              key={m}
              label={m}
              selected
              onPress={() => update({ medications: toggle(draft.medications, m) })}
            />
          ))}

        <SectionHeader>Medicamentos comumente usados</SectionHeader>
        <SelectableList
          options={HEADACHE_COMMON_MEDICATIONS}
          selected={draft.medications}
          onToggle={(v) => update({ medications: toggle(draft.medications, v) })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
