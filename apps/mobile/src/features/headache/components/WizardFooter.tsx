import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HT } from '../theme';

interface Props {
  onSave: () => void;
  onNext?: () => void;
  isLast: boolean;
  saving?: boolean;
}

export function WizardFooter({ onSave, onNext, isLast, saving }: Props) {
  if (isLast) {
    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveFull, saving && styles.disabled]}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color={HT.onPrimary} /> : <Text style={styles.nextText}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.save, saving && styles.disabled]}
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color={HT.text} />
        ) : (
          <Text style={styles.saveText}>Salvar</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.next} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.nextText}>Próximo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: HT.wizardBg,
  },
  save: {
    flex: 1,
    backgroundColor: HT.surfaceMuted,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: HT.text, fontSize: 16, fontWeight: '600' },
  next: {
    flex: 2,
    backgroundColor: HT.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveFull: {
    flex: 1,
    backgroundColor: HT.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { color: HT.onPrimary, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
