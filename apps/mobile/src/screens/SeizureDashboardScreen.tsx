import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api';
import type { MeResponse } from '../types';
import type { MainStackParamList } from '../navigation/types';
import type { SeizureEntry, SeizureEntriesResponse } from './seizureTypes';
import { T } from '../theme/tokens';
import { FluentIcon } from '../components/FluentIcon';

const C = {
  primary: T.color.primaryStrong,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  border: T.color.separator,
  leve: T.color.green,
  leveBg: T.color.greenSoft,
  moderada: T.color.orange,
  moderadaBg: T.color.orangeSoft,
  severa: T.color.red,
  severaBg: T.color.redSoft,
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h} horas`;
}

function YesNoBadge({ value, yesLabel, noLabel }: { value: boolean; yesLabel: string; noLabel: string }) {
  const style = value
    ? { color: C.severa, bg: C.severaBg }
    : { color: C.leve, bg: C.leveBg };
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.color }]}>{value ? yesLabel : noLabel}</Text>
    </View>
  );
}

function SeizureCard({ entry }: { entry: SeizureEntry }) {
  const notePreview = entry.additionalNotes
    ? entry.additionalNotes.length > 80
      ? `${entry.additionalNotes.slice(0, 80)}…`
      : entry.additionalNotes
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(entry.seizureDate)}</Text>
        <YesNoBadge
          value={entry.lossOfConsciousness}
          yesLabel="Perda consciência"
          noLabel="Consciente"
        />
      </View>

      <Text style={styles.field}>
        <Text style={styles.fieldLabel}>Hospital: </Text>
        {entry.hospitalVisit
          ? entry.hospitalName
            ? `Sim — ${entry.hospitalName}`
            : 'Sim'
          : 'Não'}
      </Text>

      <Text style={styles.field}>
        <Text style={styles.fieldLabel}>Duração: </Text>
        {formatDuration(entry.durationMinutes)}
      </Text>

      <Text style={styles.field}>
        <Text style={styles.fieldLabel}>Medicação correta: </Text>
        {entry.medicationTakenCorrectly ? 'Sim' : 'Não'}
      </Text>

      {entry.medicationBrandChanged && entry.newMedicationBrand && (
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Marca alterada para: </Text>
          {entry.newMedicationBrand}
        </Text>
      )}

      {notePreview && (
        <Text style={styles.noteText} numberOfLines={2}>
          “{notePreview}”
        </Text>
      )}
    </View>
  );
}

export function SeizureDashboardScreen() {
  const navigation = useNavigation<Nav>();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const entriesQuery = useQuery({
    queryKey: ['seizure', 'entries', patientId],
    queryFn: () => apiGet<SeizureEntriesResponse>(`/patients/${patientId}/seizure-diary`),
    enabled: !!patientId,
  });

  const entries = (entriesQuery.data?.entries ?? []).slice().sort((a, b) => {
    if (a.seizureDate === b.seizureDate) return b.createdAt.localeCompare(a.createdAt);
    return b.seizureDate.localeCompare(a.seizureDate);
  });

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Diário de Convulsão</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('RegisterSeizure')}
        >
          <FluentIcon name="pulse" size={19} color={C.onPrimary} />
          <Text style={styles.primaryBtnText}>+ Nova crise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('SeizureReports')}
        >
          <FluentIcon name="chart-box-outline" size={19} color={C.primary} />
          <Text style={styles.secondaryBtnText}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      {entriesQuery.isLoading && (
        <ActivityIndicator color={C.primary} style={styles.loader} />
      )}

      {entriesQuery.isError && (
        <Text style={styles.errorText}>
          Não foi possível carregar as crises. Verifique sua conexão.
        </Text>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          !entriesQuery.isLoading ? (
            <Text style={styles.emptyText}>Nenhuma crise registrada ainda.</Text>
          ) : null
        }
        renderItem={({ item }) => <SeizureCard entry={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerRow: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: T.radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...T.shadow.soft,
  },
  primaryBtnText: { color: C.onPrimary, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: T.radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: C.primary,
  },
  secondaryBtnText: { color: C.primary, fontWeight: '600', fontSize: 15 },
  loader: { marginVertical: 16 },
  errorText: { color: C.severa, textAlign: 'center', marginTop: 16, paddingHorizontal: 16 },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyText: { color: C.muted, textAlign: 'center', fontSize: 14 },
  card: {
    backgroundColor: C.surface,
    borderRadius: T.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: T.color.border,
    ...T.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: { fontSize: 15, fontWeight: '700', color: C.text },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  field: { fontSize: 13, color: C.text, marginTop: 2 },
  fieldLabel: { color: C.muted, fontWeight: '500' },
  noteText: {
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
