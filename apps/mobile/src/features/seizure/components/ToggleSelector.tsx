import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

export interface ToggleOption {
  id: string;
  label: string;
  /** Ícone opcional exibido à esquerda. */
  icon?: string;
}

interface Props {
  options: ToggleOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
}

/**
 * Lista horizontal de cards grandes para escolha binária (Sim/Não).
 * Usado nos passos de Consciência, Hospital e Medicação do wizard de
 * convulsão. Mantém o mesmo visual do ChipSelector, porém com altura maior
 * e rótulos centralizados, reforçando a decisão sim/não.
 */
export function ToggleSelector({ options, selectedId, onSelect, columns = 2 }: Props) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.card,
              { width: `${100 / columns - 2}%` },
              selected && styles.cardSelected,
            ]}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.7}
          >
            {opt.icon ? <Text style={styles.icon}>{opt.icon}</Text> : null}
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: 12 },
  card: {
    backgroundColor: HT.surface,
    borderWidth: 1.5,
    borderColor: HT.border,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: HT.borderActive,
    borderWidth: 2,
    backgroundColor: HT.primarySoft,
  },
  icon: { fontSize: 24, marginBottom: 8 },
  label: { fontSize: 16, color: HT.text, fontWeight: '500' },
  labelSelected: { color: HT.primary, fontWeight: '700' },
});
