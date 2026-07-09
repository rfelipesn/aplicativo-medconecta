import { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { HEADACHE_DURATION_STEPS } from '@medconecta/shared';
import { HT } from '../theme';

interface Props {
  index: number; // 0..steps-1
  onChange: (index: number) => void;
}

const STEPS = HEADACHE_DURATION_STEPS;
const LAST = STEPS.length - 1;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Quebra o rótulo em número grande + unidade pequena. */
function displayParts(index: number): { big: string; unit: string } {
  const step = STEPS[index];
  if (!step || step.minutes == null) return { big: '?', unit: 'não sei' };
  const [num, ...rest] = step.label.split(' ');
  return { big: num, unit: rest.join(' ') };
}

export function DurationSlider({ index, onChange }: Props) {
  const trackWidth = useRef(1);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromX = (x: number) => {
    const ratio = clamp01(x / trackWidth.current);
    onChangeRef.current(Math.round(ratio * LAST));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  const { big, unit } = displayParts(index);
  const pos = index / LAST;

  return (
    <View style={styles.wrap}>
      <View style={styles.display}>
        <View style={styles.numberRow}>
          <Text style={styles.tilde}>~</Text>
          <Text style={styles.big}>{big}</Text>
        </View>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      <View
        style={styles.track}
        onLayout={(e) => (trackWidth.current = e.nativeEvent.layout.width)}
      >
        <View style={styles.trackBg} {...pan.panHandlers}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { left: `${(i / LAST) * 100}%` }]}
              pointerEvents="none"
            />
          ))}
          <View style={[styles.thumb, { left: `${pos * 100}%` }]} pointerEvents="none" />
        </View>
      </View>

      <View style={styles.endLabels}>
        <Text style={styles.endLabel}>NÃO SEI</Text>
        <Text style={styles.endLabel}>8+ HORAS</Text>
      </View>
    </View>
  );
}

const THUMB = 28;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, flex: 1, justifyContent: 'center' },
  display: { alignItems: 'center', marginBottom: 60 },
  numberRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tilde: { fontSize: 48, fontWeight: '700', color: HT.text, marginTop: 16, marginRight: 4 },
  big: { fontSize: 110, fontWeight: '800', color: HT.text, lineHeight: 120 },
  unit: { fontSize: 18, color: HT.muted, marginTop: -8 },
  track: { height: THUMB, justifyContent: 'center' },
  trackBg: {
    height: 6,
    backgroundColor: HT.surfaceMuted,
    borderRadius: 3,
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: HT.mutedLight,
    marginLeft: -2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#fff',
    marginLeft: -THUMB / 2,
    borderWidth: 1,
    borderColor: HT.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  endLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  endLabel: { fontSize: 11, color: HT.muted, fontWeight: '600', letterSpacing: 0.5 },
});
