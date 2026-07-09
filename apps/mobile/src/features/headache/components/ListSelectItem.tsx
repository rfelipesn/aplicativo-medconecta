import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}

/** Card de seleção (multi ou única) com texto e ícone opcional à esquerda. */
export function ListSelectItem({ label, selected, onPress, icon }: Props) {
  return (
    <TouchableOpacity
      style={[styles.item, selected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HT.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  itemSelected: {
    backgroundColor: HT.primarySoft,
    borderColor: HT.primary,
  },
  icon: { fontSize: 20, marginRight: 12 },
  label: { flex: 1, fontSize: 15, color: HT.text },
  labelSelected: { fontWeight: '600' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: HT.mutedLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: HT.primary, borderColor: HT.primary },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
