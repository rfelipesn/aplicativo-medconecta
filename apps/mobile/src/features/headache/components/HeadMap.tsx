import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HEAD_REGIONS_BACK, HEAD_REGIONS_FRONT, type HeadRegion } from '@medconecta/shared';
import { HT } from '../theme';

type Side = 'front' | 'back';

interface Props {
  side: Side;
  onToggleSide: (side: Side) => void;
  selectedFront: string[];
  selectedBack: string[];
  onToggleRegion: (side: Side, id: string) => void;
}

const MAP_HEIGHT = 360;

export function HeadMap({
  side,
  onToggleSide,
  selectedFront,
  selectedBack,
  onToggleRegion,
}: Props) {
  const regions: HeadRegion[] = side === 'front' ? HEAD_REGIONS_FRONT : HEAD_REGIONS_BACK;
  const selected = side === 'front' ? selectedFront : selectedBack;
  const selectedLabels = regions.filter((r) => selected.includes(r.id)).map((r) => r.label);

  return (
    <View>
      <View style={styles.sideLabels}>
        <Text style={styles.sideLabel}>À DIREITA</Text>
        <Text style={styles.sideLabel}>ESQUERDA</Text>
      </View>

      <View style={styles.map}>
        {/* Silhueta estilizada da cabeça */}
        <View style={styles.headWrap} pointerEvents="none">
          <View style={styles.head} />
          {side === 'front' && (
            <>
              <View style={[styles.ear, { left: 12 }]} />
              <View style={[styles.ear, { right: 12 }]} />
              <View style={styles.guideV} />
              <View style={[styles.guideH, { top: '40%' }]} />
              <View style={[styles.guideH, { top: '62%' }]} />
            </>
          )}
        </View>

        {/* Regiões clicáveis */}
        {regions.map((r) => {
          const isSel = selected.includes(r.id);
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.region, { left: `${r.x * 100}%`, top: `${r.y * 100}%` }]}
              onPress={() => onToggleRegion(side, r.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, isSel && styles.dotSelected]} />
              {isSel && (
                <View style={styles.callout} pointerEvents="none">
                  <Text style={styles.calloutText}>{r.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Toggle Frente/Verso */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, side === 'front' && styles.toggleActive]}
          onPress={() => onToggleSide('front')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, side === 'front' && styles.toggleTextActive]}>
            Frente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, side === 'back' && styles.toggleActive]}
          onPress={() => onToggleSide('back')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, side === 'back' && styles.toggleTextActive]}>
            Verso
          </Text>
        </TouchableOpacity>
      </View>

      {selectedLabels.length > 0 && (
        <View style={styles.chips}>
          {selectedLabels.map((l) => (
            <View key={l} style={styles.chip}>
              <Text style={styles.chipText}>{l}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sideLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  sideLabel: { fontSize: 11, color: HT.muted, fontWeight: '600', letterSpacing: 0.5 },
  map: { height: MAP_HEIGHT, marginTop: 8, position: 'relative' },
  headWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  head: {
    width: 200,
    height: 280,
    borderRadius: 110,
    backgroundColor: '#E7D3BE',
    borderBottomLeftRadius: 95,
    borderBottomRightRadius: 95,
  },
  ear: {
    position: 'absolute',
    top: '46%',
    width: 26,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E0C8AF',
  },
  guideV: {
    position: 'absolute',
    width: 1,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  guideH: {
    position: 'absolute',
    width: 150,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  region: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(133,183,191,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(133,183,191,0.55)',
  },
  dotSelected: {
    backgroundColor: 'rgba(133,183,191,0.7)',
    borderColor: HT.primaryDark,
  },
  callout: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: HT.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HT.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    minWidth: 80,
  },
  calloutText: { fontSize: 11, color: HT.text, textAlign: 'center' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: HT.surfaceMuted,
    borderRadius: 24,
    padding: 4,
    marginTop: 12,
    marginHorizontal: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  toggleActive: {
    backgroundColor: HT.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  toggleText: { fontSize: 14, color: HT.muted },
  toggleTextActive: { color: HT.text, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  chip: {
    backgroundColor: HT.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, color: HT.primary, fontWeight: '600' },
});
