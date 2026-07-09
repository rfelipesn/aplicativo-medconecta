import { ScrollView, StyleSheet, View } from 'react-native';
import { HEADACHE_DEFAULT_TYPES } from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { ActionPills } from '../components/ActionPills';
import { SectionHeader } from '../components/SectionHeader';
import { ListSelectItem } from '../components/ListSelectItem';
import type { StepProps } from './common';

const TYPE_ICONS: Record<string, string> = {
  migraine: '🤕',
  tension: '😣',
  cluster: '😖',
};

export function StepType({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle
        before="Qual é o "
        highlight="tipo"
        after=" de dor de cabeça?"
        subtitle="Tipos de dores de cabeça ⓘ"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ActionPills onAdd={() => undefined} />
        <SectionHeader>Tipos comuns</SectionHeader>
        {HEADACHE_DEFAULT_TYPES.map((t) => (
          <ListSelectItem
            key={t.id}
            label={t.label}
            icon={TYPE_ICONS[t.id]}
            selected={draft.types.includes(t.id)}
            onPress={() => update({ types: draft.types.includes(t.id) ? [] : [t.id] })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 16 },
});
