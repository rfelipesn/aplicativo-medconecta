import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';
import { FluentIcon } from '../../../components/FluentIcon';

interface Props {
  onClose: () => void;
}

export function WizardHeader({ onClose }: Props) {
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
      <Text style={styles.title}>Registrar convulsão</Text>
      <View style={styles.spacer} />
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
  spacer: { width: 38 },
});
