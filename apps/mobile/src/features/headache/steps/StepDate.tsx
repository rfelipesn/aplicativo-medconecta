import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  HEADACHE_PERIODS,
  HEADACHE_PERIOD_LABELS,
  periodFromHour,
  type HeadachePeriod,
} from '@medconecta/shared';
import { WizardTitle } from '../components/WizardTitle';
import { ChipSelector, type ChipOption } from '../components/ChipSelector';
import { HT } from '../theme';
import { formatDateShort } from '../format';
import { addDays, nowHHmm, todayIso } from '../utils';
import type { StepProps } from './common';

export function StepDate({ draft, update }: StepProps) {
  const isToday = draft.diaryDate === todayIso();
  const currentHour = new Date().getHours();
  const periodStart: Record<HeadachePeriod, number> = {
    madrugada: 0,
    manha: 6,
    tarde: 12,
    noite: 18,
  };

  const periodChips: ChipOption[] = HEADACHE_PERIODS.map((p) => ({
    id: p,
    label: HEADACHE_PERIOD_LABELS[p],
    disabled: isToday && periodStart[p] > currentHour,
  }));
  const extraChips: ChipOption[] = [
    { id: 'agora', label: 'Agora' },
    { id: 'exato', label: '⏱ Exato' },
  ];

  function selectChip(id: string) {
    if (id === 'agora') {
      const p = periodFromHour(new Date().getHours());
      update({ startChoice: 'agora', startPeriod: p, startTime: nowHHmm() });
    } else if (id === 'exato') {
      update({ startChoice: 'exato', startTime: draft.startTime ?? nowHHmm(), startPeriod: periodFromHour(Number((draft.startTime ?? nowHHmm()).slice(0, 2))) });
    } else {
      update({ startChoice: id, startPeriod: id as HeadachePeriod, startTime: null });
    }
  }

  function adjustExact(deltaMin: number) {
    const base = draft.startTime ?? nowHHmm();
    const [h, m] = base.split(':').map(Number);
    let total = (h * 60 + m + deltaMin + 1440) % 1440;
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    const hhmm = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    update({ startTime: hhmm, startPeriod: periodFromHour(nh) });
  }

  return (
    <View style={styles.root}>
      <WizardTitle before="Quando a crise " highlight="começou?" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Início */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Início</Text>
            <View style={styles.dateControls}>
              <TouchableOpacity
                style={styles.arrow}
                onPress={() => update({ diaryDate: addDays(draft.diaryDate, -1) })}
              >
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{formatDateShort(draft.diaryDate)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.arrow, isToday && styles.arrowDisabled]}
                disabled={isToday}
                onPress={() => update({ diaryDate: addDays(draft.diaryDate, 1) })}
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
              <Text style={styles.exactTime}>{draft.startTime ?? nowHHmm()}</Text>
              <TouchableOpacity style={styles.exactBtn} onPress={() => adjustExact(15)}>
                <Text style={styles.exactBtnText}>+15min</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Card Fim */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Fim</Text>
            <TouchableOpacity
              style={styles.datePill}
              onPress={() =>
                update({ endDateTime: draft.endDateTime ? null : new Date().toISOString() })
              }
            >
              <Text style={styles.datePillText}>
                {draft.endDateTime
                  ? new Date(draft.endDateTime).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Não especificado'}
              </Text>
            </TouchableOpacity>
          </View>
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
