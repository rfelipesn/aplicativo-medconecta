import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

interface Props {
  onClose: () => void;
  onSettings?: () => void;
}

export function WizardHeader({ onClose, onSettings }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.circle} onPress={onClose} activeOpacity={0.7}>
        <Text style={styles.circleText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Registrar crise</Text>
      <TouchableOpacity style={styles.circle} onPress={onSettings} activeOpacity={0.7}>
        <Text style={styles.circleText}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: HT.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { fontSize: 16, color: HT.text },
  title: { fontSize: 16, fontWeight: '500', color: HT.text },
});
