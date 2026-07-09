import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api';
import type { MeResponse } from '../types';
import { listHeadacheEntries } from '../features/headache/api';
import type { HeadacheEntry } from '../features/headache/types';
import type { MainStackParamList } from '../navigation/types';
import { T } from '../theme/tokens';

const SEV = {
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
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h} horas`;
}

function intensityStyle(intensity: number | null) {
  if (intensity == null) {
    return { color: SEV.moderada, bg: SEV.moderadaBg };
  }
  if (intensity <= 3) return { color: SEV.leve, bg: SEV.leveBg };
  if (intensity <= 6) return { color: SEV.moderada, bg: SEV.moderadaBg };
  return { color: SEV.severa, bg: SEV.severaBg };
}

function EntryCard({ entry }: { entry: HeadacheEntry }) {
  const style = intensityStyle(entry.intensity);
  const types = entry.types.join(', ') || 'Sem tipo definido';
  const notePreview = entry.notes
    ? entry.notes.length > 80
      ? `${entry.notes.slice(0, 80)}…`
      : entry.notes
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(entry.diaryDate)}</Text>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={[styles.badgeText, { color: style.color }]}>
            {entry.intensityLabel ?? '—'}
          </Text>
        </View>
      </View>

      <Text style={styles.field}>
        <Text style={styles.fieldLabel}>Tipo: </Text>
        {types}
      </Text>

      {entry.durationMinutes != null && entry.durationMinutes > 0 && (
        <Text style={styles.field}>
          <Text style={styles.fieldLabel}>Duração: </Text>
          {formatDuration(entry.durationMinutes)}
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

export function DiaryDashboardScreen() {
  const navigation = useNavigation<Nav>();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const entriesQuery = useQuery({
    queryKey: ['headache', 'entries', patientId],
    queryFn: () => listHeadacheEntries(patientId!),
    enabled: !!patientId,
  });

  const entries = (entriesQuery.data?.entries ?? []).slice().sort((a, b) => {
    if (a.diaryDate === b.diaryDate) return b.createdAt.localeCompare(a.createdAt);
    return b.diaryDate.localeCompare(a.diaryDate);
  });

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Diário de Cefaleia</Text>
        <Text style={styles.headerSubtitle}>
          {entries.length > 0
            ? `${entries.length} ${entries.length === 1 ? 'crise registrada' : 'crises registradas'}`
            : 'Acompanhe suas crises ao longo do tempo'}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('RegisterCrisis')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>+ Nova crise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Reports')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      {entriesQuery.isLoading && (
        <ActivityIndicator color={T.color.primary} style={styles.loader} />
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
        renderItem={({ item }) => <EntryCard entry={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.color.bg },
  headerRow: { paddingHorizontal: T.space.md, paddingTop: T.space.md, paddingBottom: 4 },
  headerTitle: { fontSize: T.font.largeTitle, fontWeight: '800', color: T.color.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: T.font.subhead, color: T.color.textSecondary, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.md,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    ...T.shadow.soft,
  },
  primaryBtnText: { color: T.color.onPrimary, fontWeight: '700', fontSize: T.font.body },
  secondaryBtn: {
    flex: 1,
    backgroundColor: T.color.primarySoft,
    borderRadius: T.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: T.color.primaryDark, fontWeight: '700', fontSize: T.font.body },
  loader: { marginVertical: 16 },
  errorText: { color: SEV.severa, textAlign: 'center', marginTop: 16, paddingHorizontal: 16 },
  list: { paddingHorizontal: T.space.md, paddingBottom: 32, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyText: { color: T.color.textSecondary, textAlign: 'center', fontSize: T.font.body },
  card: {
    backgroundColor: T.color.surface,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    ...T.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: { fontSize: T.font.body, fontWeight: '700', color: T.color.text },
  badge: { borderRadius: T.radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: T.font.caption, fontWeight: '800', letterSpacing: 0.3 },
  field: { fontSize: T.font.subhead, color: T.color.text, marginTop: 3 },
  fieldLabel: { color: T.color.textSecondary, fontWeight: '500' },
  noteText: {
    fontSize: T.font.subhead,
    color: T.color.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
