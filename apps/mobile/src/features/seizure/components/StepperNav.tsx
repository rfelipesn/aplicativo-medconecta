import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';
import { WIZARD_STEPS } from '../steps/config';

interface Props {
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Barra de abas inferior rolável (stepper) — wizard de convulsão. */
export function StepperNav({ activeIndex, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {WIZARD_STEPS.map((step, index) => {
          const active = index === activeIndex;
          return (
            <TouchableOpacity
              key={step.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onSelect(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{step.icon}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>{step.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: HT.border, backgroundColor: HT.wizardBg },
  content: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 60,
  },
  tabActive: { backgroundColor: HT.primarySoft },
  icon: { fontSize: 18, marginBottom: 2 },
  label: { fontSize: 11, color: HT.muted },
  labelActive: { color: HT.primary, fontWeight: '600' },
});
