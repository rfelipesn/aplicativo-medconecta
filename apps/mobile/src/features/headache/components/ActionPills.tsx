import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

interface Props {
  onAdd: () => void;
  onCustomize?: () => void;
}

/** Pills "＋ Adicionar" e "⚙ Personalizar lista" usados no topo das listas. */
export function ActionPills({ onAdd, onCustomize }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.pill} onPress={onAdd} activeOpacity={0.7}>
        <Text style={styles.pillText}>＋ Adicionar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.pill}
        onPress={onCustomize}
        activeOpacity={0.7}
        disabled={!onCustomize}
      >
        <Text style={styles.pillText}>⚙ Personalizar lista</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  pill: {
    backgroundColor: HT.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillText: { fontSize: 13, color: HT.text, fontWeight: '500' },
});
