import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

export interface ChipOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  options: ChipOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
}

/** Grid de chips com seleção exclusiva (1 por vez). */
export function ChipSelector({ options, selectedId, onSelect, columns = 3 }: Props) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.chip,
              { width: `${100 / columns - 2}%` },
              selected && styles.chipSelected,
              opt.disabled && styles.chipDisabled,
            ]}
            onPress={() => !opt.disabled && onSelect(opt.id)}
            disabled={opt.disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selected && styles.chipTextSelected,
                opt.disabled && styles.chipTextDisabled,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: 10 },
  chip: {
    backgroundColor: HT.surface,
    borderWidth: 1.5,
    borderColor: HT.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chipSelected: { borderColor: HT.borderActive, borderWidth: 2, backgroundColor: HT.primarySoft },
  chipDisabled: { backgroundColor: HT.surfaceMuted, borderColor: HT.border },
  chipText: { fontSize: 14, color: HT.text, fontWeight: '500' },
  chipTextSelected: { color: HT.primary, fontWeight: '700' },
  chipTextDisabled: { color: HT.mutedLight },
});
