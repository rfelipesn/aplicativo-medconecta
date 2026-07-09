import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { HOSPITAL_VISIT_OPTIONS } from '@medconecta/shared';
import { WizardTitle } from '../../headache/components/WizardTitle';
import { ToggleChoice, type ToggleOption } from '../components/ToggleChoice';
import { HT } from '../theme';
import type { StepProps } from './common';

const OPTIONS: ToggleOption[] = HOSPITAL_VISIT_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function StepHospital({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Foi ao " highlight="hospital" after="?" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ToggleChoice
          options={OPTIONS}
          selectedValue={draft.hospitalVisit}
          onSelect={(v) => update({ hospitalVisit: v, hospitalName: v ? draft.hospitalName : '' })}
        />
        {draft.hospitalVisit && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={draft.hospitalName}
              onChangeText={(t) => update({ hospitalName: t })}
              placeholder="Nome do hospital"
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
