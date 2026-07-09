import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WizardTitle } from '../components/WizardTitle';
import { IntensitySlider } from '../components/IntensitySlider';
import { HT } from '../theme';
import type { StepProps } from './common';

export function StepIntensity({ draft, update }: StepProps) {
  return (
    <View style={{ flex: 1 }}>
      <WizardTitle before="Quão intensa está a crise?" />
      <View style={styles.subRow}>
        <Text style={styles.sub}>Precisa de mais graduações? </Text>
        <TouchableOpacity>
          <Text style={styles.link}>Configurar</Text>
        </TouchableOpacity>
      </View>
      <IntensitySlider
        value={draft.intensitySlider ?? 0}
        onChange={(v) => update({ intensitySlider: v })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subRow: { flexDirection: 'row', justifyContent: 'center', marginTop: -8, marginBottom: 8 },
  sub: { fontSize: 13, color: HT.muted },
  link: { fontSize: 13, color: HT.primary, fontWeight: '600' },
});
