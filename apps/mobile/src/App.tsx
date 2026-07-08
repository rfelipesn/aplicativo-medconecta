import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';

export function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.logo}>MEDconecta</Text>
          <Text style={styles.slogan}>Saúde conectada, porque cuidar é estar presente.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aviso importante</Text>
          <Text style={styles.noticeStrong}>{ELECTIVE_SCOPE_NOTICE.short}</Text>
          <Text style={styles.notice}>{ELECTIVE_SCOPE_NOTICE.emergency}</Text>
          <Text style={styles.disclaimer}>{ELECTIVE_SCOPE_NOTICE.disclaimer}</Text>
        </View>

        <Text style={styles.footer}>
          Esqueleto inicial (Fase 0). Próximo: login com senha temporária, senha/PIN e biometria.
        </Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const COLORS = {
  primary: '#1B5FA8',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#333333',
  muted: '#6B7B8D',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primary, padding: 24, paddingTop: 32 },
  logo: { color: '#fff', fontSize: 26, fontWeight: '600' },
  slogan: { color: '#fff', opacity: 0.9, marginTop: 4, fontSize: 13 },
  card: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  noticeStrong: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  notice: { fontSize: 14, color: COLORS.text, marginBottom: 8 },
  disclaimer: { fontSize: 13, color: COLORS.muted },
  footer: { textAlign: 'center', color: COLORS.muted, fontSize: 12, paddingHorizontal: 24 },
});
