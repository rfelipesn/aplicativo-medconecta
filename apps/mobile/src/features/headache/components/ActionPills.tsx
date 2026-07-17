import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';
import { FluentIcon } from '../../../components/FluentIcon';

interface Props {
  onAdd: () => void;
  onCustomize?: () => void;
}

/** Pills "Adicionar" e "Personalizar lista" usados no topo das listas. */
export function ActionPills({ onAdd, onCustomize }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.pill} onPress={onAdd} activeOpacity={0.7}>
        <FluentIcon name="plus" size={14} color={HT.text} />
        <Text style={styles.pillText}>Adicionar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pill, !onCustomize && styles.pillDisabled]}
        onPress={onCustomize}
        activeOpacity={0.7}
        disabled={!onCustomize}
      >
        <FluentIcon name="tune-variant" size={14} color={HT.text} />
        <Text style={styles.pillText}>Personalizar lista</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HT.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: HT.border,
  },
  pillDisabled: { opacity: 0.55 },
  pillText: { fontSize: 13, color: HT.text, fontWeight: '600' },
});
