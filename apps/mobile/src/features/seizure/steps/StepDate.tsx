import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  SEIZURE_PERIODS,
  SEIZURE_PERIOD_LABELS,
  seizurePeriodFromHour,
  type SeizurePeriod,
} from '@medconecta/shared';
import { WizardTitle } from '../../headache/components/WizardTitle';
import { ChipSelector, type ChipOption } from '../../headache/components/ChipSelector';
import { HT } from '../theme';
import { formatDate, addDays, nowHHmm, todayIso } from '../utils';
import type { StepProps } from './common';

export function StepDate({ draft, update }: StepProps) {
  const isToday = draft.seizureDate === todayIso();
  const currentHour = new Date().getHours();
  const periodStart: Record<SeizurePeriod, number> = {
    madrugada: 0,
    manha: 6,
    tarde: 12,
    noite: 18,
  };

  const periodChips: ChipOption[] = SEIZURE_PERIODS.map((p) => ({
    id: p,
    label: SEIZURE_PERIOD_LABELS[p],
    disabled: isToday && periodStart[p] > currentHour,
  }));
  const extraChips: ChipOption[] = [
    { id: 'agora', label: 'Agora' },
    { id: 'exato', label: '⏱ Exato' },
  ];

  function selectChip(id: string) {
    if (id === 'agora') {
      const p = seizurePeriodFromHour(new Date().getHours());
      update({ startChoice: 'agora', startPeriod: p, seizureTime: nowHHmm() });
    } else if (id === 'exato') {
      const time = draft.seizureTime ?? nowHHmm();
      update({
        startChoice: 'exato',
        seizureTime: time,
        startPeriod: seizurePeriodFromHour(Number(time.slice(0, 2))),
      });
    } else {
      update({ startChoice: id, startPeriod: id as SeizurePeriod, seizureTime: null });
    }
  }

  function adjustExact(deltaMin: number) {
    const base = draft.seizureTime ?? nowHHmm();
    const [h, m] = base.split(':').map(Number);
    let total = (h * 60 + m + deltaMin + 1440) % 1440;
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    const hhmm = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    update({ seizureTime: hhmm, startPeriod: seizurePeriodFromHour(nh) });
  }

  return (
    <View style={styles.root}>
      <WizardTitle before="Quando a crise " highlight="ocorreu?" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Data</Text>
            <View style={styles.dateControls}>
              <TouchableOpacity
                style={styles.arrow}
                onPress={() => update({ seizureDate: addDays(draft.seizureDate, -1) })}
              >
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{formatDate(draft.seizureDate)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.arrow, isToday && styles.arrowDisabled]}
                disabled={isToday}
                onPress={() => update({ seizureDate: addDays(draft.seizureDate, 1) })}
              >
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chipsArea}>
            <ChipSelector
              options={periodChips}
              selectedId={draft.startChoice}
              onSelect={selectChip}
            />
            <View style={{ height: 10 }} />
            <ChipSelector
              options={extraChips}
              selectedId={draft.startChoice}
              onSelect={selectChip}
              columns={2}
            />
          </View>

          {draft.startChoice === 'exato' && (
            <View style={styles.exactRow}>
              <TouchableOpacity style={styles.exactBtn} onPress={() => adjustExact(-15)}>
                <Text style={styles.exactBtnText}>−15min</Text>
              </TouchableOpacity>
              <Text style={styles.exactTime}>{draft.seizureTime ?? nowHHmm()}</Text>
              <TouchableOpacity style={styles.exactBtn} onPress={() => adjustExact(15)}>
                <Text style={styles.exactBtnText}>+15min</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: HT.surfaceMuted,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 16, fontWeight: '700', color: HT.text },
  dateControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: HT.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.4 },
  arrowText: { fontSize: 18, color: HT.text, lineHeight: 20 },
  datePill: {
    backgroundColor: HT.surface,
    borderWidth: 1,
    borderColor: HT.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  datePillText: { fontSize: 14, color: HT.text, fontWeight: '500' },
  chipsArea: { marginTop: 16 },
  exactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: HT.surface,
    borderRadius: 12,
    padding: 10,
  },
  exactBtn: {
    backgroundColor: HT.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exactBtnText: { fontSize: 13, color: HT.text, fontWeight: '600' },
  exactTime: { fontSize: 22, fontWeight: '700', color: HT.text },
});
