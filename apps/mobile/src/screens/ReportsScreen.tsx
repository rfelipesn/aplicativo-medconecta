import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { MeResponse } from '../types';
import { getHeadacheStats } from '../features/headache/api';
import type { HeadacheStats } from '@medconecta/shared';
import { Card } from '../features/headache/components/Card';
import { BarChart, HBars } from '../features/headache/components/Charts';
import type { BarDatum } from '../features/headache/components/Charts';

const C = {
  primary: '#85B7BF',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#333333',
  muted: '#6B7B8D',
  leve: '#27AE60',
  leveBg: '#E6F7ED',
  moderada: '#E67E22',
  moderadaBg: '#FFF4E6',
  severa: '#C0392B',
  severaBg: '#FDECEA',
  border: '#DDE3EA',
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h} horas`;
}

function SeverityBar({
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
    <View style={styles.sevRow}>
      <View style={[styles.sevBadge, { backgroundColor: bg }]}>
        <Text style={[styles.sevBadgeText, { color }]}>{label}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={styles.sevValue}>{pct}%</Text>
    </View>
  );
}

export function ReportsScreen() {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const statsQuery = useQuery({
    queryKey: ['headache', 'stats', patientId, 30],
    queryFn: () => getHeadacheStats(patientId!, 30),
    enabled: !!patientId,
  });

  const stats: HeadacheStats | undefined = statsQuery.data?.stats;

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

  const dominant = stats.severity.predominant;
  const dominantColor =
    dominant === 'leve' ? C.leve : dominant === 'moderado' ? C.moderada : dominant === 'severo' ? C.severa : C.muted;
  const dominantLabel = dominant ? dominant.charAt(0).toUpperCase() + dominant.slice(1) : '—';

  const severityTotal = stats.severity.leve + stats.severity.moderado + stats.severity.severo;

  const weekdayBarData: BarDatum[] = stats.weekday.map((v, i) => ({
    label: WEEKDAY_LABELS[i],
    value: v,
    color: C.primary,
  }));

  const topTriggers = (stats.triggers ?? []).slice(0, 3).map((t) => ({
    label: t.name,
    value: t.count,
  }));
  const topSymptoms = (stats.symptoms ?? []).slice(0, 3).map((s) => ({
    label: s.name,
    value: s.count,
  }));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Relatórios</Text>
      <Text style={styles.subtitle}>Últimos 30 dias</Text>

      <Card title="Últimos 30 dias">
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totals.count}</Text>
            <Text style={styles.statLabel}>Crises</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totals.daysWithHeadache}</Text>
            <Text style={styles.statLabel}>Dias com dor</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.frequencyPerWeek.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Por semana</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Severidade predominante</Text>
            <Text style={[styles.summaryValue, { color: dominantColor }]}>
              {dominantLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Duração média</Text>
            <Text style={styles.summaryValue}>{formatDuration(stats.duration.avgMinutes)}</Text>
          </View>
        </View>
      </Card>

      <Card title="Distribuição por severidade">
        <SeverityBar
          label="Leve"
          value={stats.severity.leve}
          total={severityTotal}
          color={C.leve}
          bg={C.leveBg}
        />
        <SeverityBar
          label="Moderada"
          value={stats.severity.moderado}
          total={severityTotal}
          color={C.moderada}
          bg={C.moderadaBg}
        />
        <SeverityBar
          label="Severa"
          value={stats.severity.severo}
          total={severityTotal}
          color={C.severa}
          bg={C.severaBg}
        />
      </Card>

      <Card title="Dias da semana">
        <BarChart data={weekdayBarData} height={110} />
      </Card>

      <Card title="Top 3 gatilhos">
        {topTriggers.length > 0 ? (
          <HBars data={topTriggers} color={C.primary} />
        ) : (
          <Text style={styles.muted}>Nenhum gatilho registrado.</Text>
        )}
      </Card>

      <Card title="Top 3 sintomas">
        {topSymptoms.length > 0 ? (
          <HBars data={topSymptoms} color={C.primary} />
        ) : (
          <Text style={styles.muted}>Nenhum sintoma registrado.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 13, color: C.muted, marginBottom: 12 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: C.muted, fontSize: 13 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: C.border },
  summaryRow: { flexDirection: 'row', marginTop: 16, gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEF1F5' },
  summaryLabel: { fontSize: 12, color: C.muted, marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: C.text },
  sevRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sevBadge: { width: 96, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  sevBadgeText: { fontSize: 12, fontWeight: '700' },
  barTrack: { flex: 1, height: 10, backgroundColor: '#EEF1F5', borderRadius: 5 },
  barFill: { height: 10, borderRadius: 5 },
  sevValue: { width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700', color: C.text },
});
