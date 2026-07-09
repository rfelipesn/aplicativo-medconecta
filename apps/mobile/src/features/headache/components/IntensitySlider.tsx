import { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import {
  HEADACHE_INTENSITY_LEVELS,
  intensityLabel,
  sliderToIntensity,
} from '@medconecta/shared';
import { HT, lerpColor } from '../theme';

interface Props {
  value: number; // 0..1
  onChange: (value: number) => void;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function IntensitySlider({ value, onChange }: Props) {
  const trackWidth = useRef(1);
  const base = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const v = clamp01(e.nativeEvent.locationX / trackWidth.current);
        base.current = v;
        onChangeRef.current(v);
      },
      onPanResponderMove: (_e, g) => {
        const v = clamp01(base.current + g.dx / trackWidth.current);
        onChangeRef.current(v);
      },
    }),
  ).current;

  const intensity = sliderToIntensity(value);
  const label = intensityLabel(intensity);
  const level = HEADACHE_INTENSITY_LEVELS.find((l) => intensity >= l.min && intensity <= l.max);

  // Círculo: 150 → 300 px; cor clara → primária; opacidade 0.35 → 1.0
  const size = 150 + value * 150;
  const color = lerpColor(HT.primaryLight, HT.primary, value);
  const opacity = 0.35 + value * 0.65;

  return (
    <View style={styles.wrap}>
      <View style={styles.circleArea}>
        <View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity },
          ]}
        />
      </View>

      <View style={styles.labelRow}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.desc}>{level?.description ?? ''}</Text>
        </View>
        <Text style={styles.info}>ⓘ</Text>
      </View>

      <View style={styles.track} onLayout={(e) => (trackWidth.current = e.nativeEvent.layout.width)}>
        <View style={styles.trackBg} {...pan.panHandlers}>
          <View style={[styles.fill, { width: `${value * 100}%` }]} />
          <View style={[styles.thumb, { left: `${value * 100}%` }]} />
        </View>
      </View>
      <View style={styles.endLabels}>
        <Text style={styles.endLabel}>LEVE</Text>
        <Text style={styles.endLabel}>SEVERO</Text>
      </View>
    </View>
  );
}

const THUMB = 28;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, flex: 1, justifyContent: 'center' },
  circleArea: { height: 320, alignItems: 'center', justifyContent: 'center' },
  circle: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  label: { fontSize: 26, fontWeight: '700', color: HT.text, textAlign: 'center' },
  desc: { fontSize: 14, color: HT.muted, marginTop: 2 },
  info: { fontSize: 18, color: HT.muted },
  track: { height: THUMB, justifyContent: 'center' },
  trackBg: {
    height: 6,
    backgroundColor: HT.surfaceMuted,
    borderRadius: 3,
    justifyContent: 'center',
  },
  fill: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: HT.primary },
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
