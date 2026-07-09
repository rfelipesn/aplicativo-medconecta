import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  MEDICATION_BRAND_CHANGED_OPTIONS,
  MEDICATION_CORRECTLY_OPTIONS,
} from '@medconecta/shared';
import { WizardTitle } from '../../headache/components/WizardTitle';
import { SectionHeader } from '../../headache/components/SectionHeader';
import { ToggleChoice, type ToggleOption } from '../components/ToggleChoice';
import { HT } from '../theme';
import type { StepProps } from './common';

const CORRECTLY_OPTIONS: ToggleOption[] = MEDICATION_CORRECTLY_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const BRAND_OPTIONS: ToggleOption[] = MEDICATION_BRAND_CHANGED_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function StepMedication({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Como foi a " highlight="medicação" after="?" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionHeader>Tomou corretamente?</SectionHeader>
        <ToggleChoice
          options={CORRECTLY_OPTIONS}
          selectedValue={draft.medicationTakenCorrectly}
          onSelect={(v) => update({ medicationTakenCorrectly: v })}
        />

        <SectionHeader>Mudou de marca?</SectionHeader>
        <ToggleChoice
          options={BRAND_OPTIONS}
          selectedValue={draft.medicationBrandChanged}
          onSelect={(v) =>
            update({
              medicationBrandChanged: v,
              newMedicationBrand: v ? draft.newMedicationBrand : '',
            })
          }
        />

        {draft.medicationBrandChanged && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={draft.newMedicationBrand}
              onChangeText={(t) => update({ newMedicationBrand: t })}
              placeholder="Nova marca"
              placeholderTextColor={HT.muted}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  inputWrap: { marginTop: 16 },
  input: {
    backgroundColor: HT.surfaceMuted,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: HT.text,
  },
});
