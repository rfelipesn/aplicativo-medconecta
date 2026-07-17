import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';
import { WIZARD_STEPS } from '../steps/config';
import { FluentIcon, type FluentIconName } from '../../../components/FluentIcon';

const STEP_ICONS: Record<string, FluentIconName> = {
  date: 'calendar-month-outline',
  duration: 'clock-outline',
  intensity: 'chart-bar',
  type: 'lightning-bolt-outline',
  location: 'account-outline',
  symptoms: 'head-cog-outline',
  triggers: 'target',
  medications: 'pill',
  relief: 'flower-outline',
  disability: 'run',
  notes: 'note-edit-outline',
};

interface Props {
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Barra de abas inferior rolável (stepper). */
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
              <FluentIcon
                name={STEP_ICONS[step.key] ?? 'circle-outline'}
                size={18}
                color={active ? HT.onPrimary : HT.muted}
              />
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
  content: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
  },
  tabActive: { backgroundColor: HT.primary, borderWidth: 1, borderColor: HT.primary },
  label: { fontSize: 11, color: HT.muted, marginTop: 3 },
  labelActive: { color: HT.onPrimary, fontWeight: '800' },
});
