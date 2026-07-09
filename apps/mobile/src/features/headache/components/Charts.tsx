import { StyleSheet, Text, View } from 'react-native';
import { HT } from '../theme';

// ── Gráfico de barras verticais ─────────────────────────────────────────────
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  /** Barra hachurada (sem ocorrência). */
  muted?: boolean;
  /** Texto exibido acima da barra (default: value). */
  topLabel?: string;
}

export function BarChart({ data, height = 120 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[styles.barChart, { height: height + 36 }]}>
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max(6, (d.value / max) * height) : 4;
        return (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barTop}>{d.topLabel ?? (d.value > 0 ? String(d.value) : '')}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: d.muted ? 'transparent' : d.color ?? HT.primary,
                  borderWidth: d.muted ? 1.5 : 0,
                  borderColor: HT.border,
                  borderStyle: 'dashed',
                },
              ]}
            />
            <Text style={styles.barLabel}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Barras horizontais (ranking) ────────────────────────────────────────────
export function HBars({
  data,
  color = HT.primary,
}: {
  data: Array<{ label: string; value: number }>;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <Text style={styles.empty}>Sem dados.</Text>;
  return (
    <View style={{ gap: 10 }}>
      {data.map((d, i) => (
        <View key={i} style={styles.hRow}>
          <Text style={styles.hLabel} numberOfLines={1}>
            {d.label}
          </Text>
          <View style={styles.hTrack}>
            <View style={[styles.hFill, { width: `${(d.value / max) * 100}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.hValue}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Donut/resumo de severidade (círculo preenchido + legenda) ───────────────
export function DonutSummary({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const dominant = segments.reduce((a, b) => (b.value > a.value ? b : a), segments[0]);
  return (
    <View style={styles.donutRow}>
      <View style={[styles.donut, { backgroundColor: total > 0 ? dominant.color : HT.surfaceMuted }]}>
        <View style={styles.donutHole} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <View key={s.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]}>
                <Text style={styles.legendDotText}>{pct}</Text>
              </View>
              <Text style={styles.legendLabel}>{s.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 6,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', borderRadius: 8, minHeight: 4 },
  barTop: { fontSize: 12, fontWeight: '700', color: HT.text, marginBottom: 4, height: 16 },
  barLabel: { fontSize: 11, color: HT.muted, marginTop: 6 },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hLabel: { width: 96, fontSize: 13, color: HT.text },
  hTrack: { flex: 1, height: 10, backgroundColor: HT.surfaceMuted, borderRadius: 5 },
  hFill: { height: 10, borderRadius: 5, minWidth: 4 },
  hValue: { width: 24, textAlign: 'right', fontSize: 13, fontWeight: '700', color: HT.text },
  empty: { color: HT.muted, fontSize: 13 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donut: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  donutHole: { width: 44, height: 44, borderRadius: 22, backgroundColor: HT.surface },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { minWidth: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  legendDotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  legendLabel: { fontSize: 14, color: HT.text },
});
