import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { MeResponse } from '../types';
import { Card } from '../features/headache/components/Card';
import { BarChart, HBars } from '../features/headache/components/Charts';
import type { BarDatum } from '../features/headache/components/Charts';
import type { SeizureStats } from '@medconecta/shared';
import type { SeizureStatsResponse } from './seizureTypes';
import { T } from '../theme/tokens';

const C = {
  primary: T.color.primary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  leve: T.color.green,
  leveBg: T.color.greenSoft,
  moderada: T.color.orange,
  moderadaBg: T.color.orangeSoft,
  severa: T.color.red,
  severaBg: T.color.redSoft,
  border: T.color.separator,
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h} horas`;
}

function PercentBar({
  label,
  value,
  total,
  color,
  bg,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  bg: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.pctRow}>
      <View style={[styles.pctBadge, { backgroundColor: bg }]}>
        <Text style={[styles.pctBadgeText, { color }]}>{label}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.pctValue}>{pct}%</Text>
    </View>
  );
}

export function SeizureReportsScreen() {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const statsQuery = useQuery({
    queryKey: ['seizure', 'stats', patientId, 30],
    queryFn: () => apiGet<SeizureStatsResponse>(`/patients/${patientId}/seizure-diary/stats?days=30`),
    enabled: !!patientId,
  });

  const stats: SeizureStats | undefined = statsQuery.data?.stats;

  if (statsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (statsQuery.isError || !stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Não foi possível carregar os relatórios.</Text>
      </View>
    );
  }

  const total = stats.totals.count;
  const weekdayBarData: BarDatum[] = stats.weekday.map((v, i) => ({
    label: WEEKDAY_LABELS[i],
    value: v,
    color: C.primary,
  }));

  const topBrands = (stats.brandChange.topBrands ?? []).slice(0, 3).map((b) => ({
    label: b.name,
    value: b.count,
  }));

  const topHospitals = (stats.hospital.mostCited ?? []).slice(0, 3).map((h) => ({
    label: h.name,
    value: h.count,
  }));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Relatórios de Convulsão</Text>
      <Text style={styles.subtitle}>Últimos 30 dias</Text>

      <Card title="Últimos 30 dias">
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totals.count}</Text>
            <Text style={styles.statLabel}>Crises</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totals.daysWithSeizure}</Text>
            <Text style={styles.statLabel}>Dias com crise</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.frequencyPerWeek.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Por semana</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Duração média</Text>
            <Text style={styles.summaryValue}>{formatDuration(stats.duration.avgMinutes)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Dias com crise (%)</Text>
            <Text style={styles.summaryValue}>{stats.totals.percentDaysWithSeizure}%</Text>
          </View>
        </View>
      </Card>

      <Card title="Perda de consciência">
        <PercentBar
          label="Com perda"
          value={stats.consciousness.withLoss}
          total={total}
          color={C.severa}
          bg={C.severaBg}
        />
        <PercentBar
          label="Sem perda"
          value={stats.consciousness.withoutLoss}
          total={total}
          color={C.leve}
          bg={C.leveBg}
        />
      </Card>

      <Card title="Visita hospitalar">
        <PercentBar
          label="Visitou"
          value={stats.hospital.visited}
          total={total}
          color={C.moderada}
          bg={C.moderadaBg}
        />
        <PercentBar
          label="Não visitou"
          value={stats.hospital.notVisited}
          total={total}
          color={C.leve}
          bg={C.leveBg}
        />
      </Card>

      <Card title="Dias da semana">
        <BarChart data={weekdayBarData} height={110} />
      </Card>

      <Card title="Top 3 marcas (mudança)">
        {topBrands.length > 0 ? (
          <HBars data={topBrands} color={C.primary} />
        ) : (
          <Text style={styles.muted}>Nenhuma mudança de marca registrada.</Text>
        )}
      </Card>

      <Card title="Hospital mais visitado">
        {topHospitals.length > 0 ? (
          <HBars data={topHospitals} color={C.primary} />
        ) : (
          <Text style={styles.muted}>Nenhuma visita hospitalar registrada.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginBottom: 12 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: C.muted, fontSize: 13 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: C.border },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  summaryLabel: { fontSize: 12, color: C.muted, marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: C.text },
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pctBadge: {
    width: 96,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pctBadgeText: { fontSize: 12, fontWeight: '700' },
  barTrack: { flex: 1, height: 10, backgroundColor: T.color.surfaceMuted, borderRadius: 5 },
  barFill: { height: 10, borderRadius: 5 },
  pctValue: { width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700', color: C.text },
});
