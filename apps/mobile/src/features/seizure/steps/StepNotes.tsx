import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { WizardTitle } from '../../headache/components/WizardTitle';
import { HT } from '../theme';
import type { StepProps } from './common';

export function StepNotes({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Observações adicionais" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          value={draft.additionalNotes}
          onChangeText={(t) => update({ additionalNotes: t })}
          placeholder="Ex.: gatilhos, sintomas de aura, como você se sentiu depois"
          placeholderTextColor={HT.muted}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  input: {
    backgroundColor: HT.surfaceMuted,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: HT.text,
    minHeight: 280,
  },
});
