import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

export interface ToggleOption {
  value: boolean;
  label: string;
}

interface Props {
  options: ToggleOption[];
  selectedValue: boolean | null;
  onSelect: (value: boolean) => void;
}

/** Par de opções Sim/Não (exclusivas), usado em passos do wizard de convulsão. */
export function ToggleChoice({ options, selectedValue, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === selectedValue;
        return (
          <TouchableOpacity
            key={opt.label}
            style={[styles.tab, selected && styles.tabSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  tab: {
    flex: 1,
    backgroundColor: HT.surface,
    borderWidth: 1.5,
    borderColor: HT.border,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabSelected: { borderColor: HT.borderActive, backgroundColor: HT.primarySoft, borderWidth: 2 },
  tabText: { fontSize: 15, color: HT.text, fontWeight: '500' },
  tabTextSelected: { color: HT.primary, fontWeight: '700' },
});
