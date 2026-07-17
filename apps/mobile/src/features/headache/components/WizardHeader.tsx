import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';
import { FluentIcon } from '../../../components/FluentIcon';

interface Props {
  onClose: () => void;
  onSettings?: () => void;
}

export function WizardHeader({ onClose, onSettings }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.circle}
        onPress={onClose}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        <FluentIcon name="close" size={20} color={HT.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Registrar crise</Text>
      <TouchableOpacity
        style={styles.circle}
        onPress={onSettings}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Ajustes"
        disabled={!onSettings}
      >
        <FluentIcon name="tune-variant" size={20} color={HT.text} />
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
    paddingVertical: 14,
    backgroundColor: HT.wizardBg,
    borderBottomWidth: 1,
    borderBottomColor: HT.border,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: HT.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: HT.text },
});
