import { ScrollView, StyleSheet, View } from 'react-native';
import { HEADACHE_DISABILITY_OPTIONS } from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { SectionHeader } from '../components/SectionHeader';
import { ListSelectItem } from '../components/ListSelectItem';
import { toggle } from '../utils';
import type { StepProps } from './common';

const NOT_AFFECTED = 'not_affected';

export function StepDisability({ draft, update }: StepProps) {
  const selected = draft.impactOnActivities;

  function onToggle(id: string) {
    if (id === NOT_AFFECTED) {
      update({ impactOnActivities: selected.includes(NOT_AFFECTED) ? [] : [NOT_AFFECTED] });
      return;
    }
    // Selecionar qualquer outro remove o "Não Foi Afetado".
    const base = selected.filter((s) => s !== NOT_AFFECTED);
    update({ impactOnActivities: toggle(base, id) });
  }

  const lost = HEADACHE_DISABILITY_OPTIONS.filter((o) => o.section === 'lost');
  const limited = HEADACHE_DISABILITY_OPTIONS.filter((o) => o.section === 'limited');
  const notAffected = HEADACHE_DISABILITY_OPTIONS.find((o) => o.id === NOT_AFFECTED)!;

  return (
    <View style={{ flex: 1 }}>
      <WizardTitle
        before="Como a Dor de Cabeça "
        highlight="Afetou"
        after=" suas Atividades?"
        subtitle="Questionário MIDAS"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ListSelectItem
          label={notAffected.label}
          selected={selected.includes(NOT_AFFECTED)}
          onPress={() => onToggle(NOT_AFFECTED)}
        />

        <SectionHeader>Atividades perdidas</SectionHeader>
        {lost.map((o) => (
          <ListSelectItem
            key={o.id}
            label={o.label}
            selected={selected.includes(o.id)}
            onPress={() => onToggle(o.id)}
          />
        ))}

        <SectionHeader>Atividades limitadas</SectionHeader>
        {limited.map((o) => (
          <ListSelectItem
            key={o.id}
            label={o.label}
            selected={selected.includes(o.id)}
            onPress={() => onToggle(o.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, paddingBottom: 16 } });
