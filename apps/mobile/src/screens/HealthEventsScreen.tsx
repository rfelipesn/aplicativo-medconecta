import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../lib/api';
import { Card } from '../features/headache/components/Card';
import { BarChart, HBars } from '../features/headache/components/Charts';
import type { BarDatum } from '../features/headache/components/Charts';
import type {
  CreateHealthEventInput,
  HealthEvent,
  HealthEventsResponse,
  HealthEventStatsResponse,
  HealthEventType,
  MeResponse,
} from '../types';
import { T } from '../theme/tokens';

const C = {
  primary: T.color.primaryStrong,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  border: T.color.separator,
} as const;

const EVENT_TYPE_LABELS: Record<HealthEventType, string> = {
  headache: 'Cefaleia',
  seizure: 'Convulsão',
  sleep: 'Sono',
  symptom: 'Sintoma',
  other: 'Outro',
};

const EVENT_TYPE_COLORS: Record<HealthEventType, string> = {
  headache: T.color.primaryStrong,
  seizure: T.color.red,
  sleep: T.color.purple,
  symptom: T.color.orange,
  other: T.color.textSecondary,
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

const TYPE_FILTERS: Array<{ value: HealthEventType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'symptom', label: 'Sintomas' },
  { value: 'headache', label: 'Cefaleia' },
  { value: 'seizure', label: 'Convulsões' },
  { value: 'sleep', label: 'Sono' },
  { value: 'other', label: 'Outros' },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDatetimeInput(date: Date): string {
  const tz = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
}

export function HealthEventsScreen() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
  });
  const patientId = meQuery.data?.user.patient?.id;

  const [days, setDays] = useState<number>(30);
  const [typeFilter, setTypeFilter] = useState<HealthEventType | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<HealthEventType>('symptom');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(() => toLocalDatetimeInput(new Date()));
  const [formError, setFormError] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['health-events', patientId, days],
    queryFn: () => apiGet<HealthEventsResponse>(`/patients/${patientId}/health-events?days=${days}`),
    enabled: !!patientId,
  });

  const statsQuery = useQuery({
    queryKey: ['health-events-stats', patientId, days],
    queryFn: () =>
      apiGet<HealthEventStatsResponse>(`/patients/${patientId}/health-events/stats?days=${days}`),
    enabled: !!patientId,
  });

  const createEvent = useMutation({
    mutationFn: (input: CreateHealthEventInput) =>
      apiPost<{ ok: boolean; event: HealthEvent }>(
        `/patients/${patientId}/health-events`,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-events', patientId] });
      queryClient.invalidateQueries({ queryKey: ['health-events-stats', patientId] });
      setFormOpen(false);
      setFormDescription('');
      setFormError(null);
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar.'),
  });

  if (meQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (!patientId) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Perfil de paciente não identificado.</Text>
      </View>
    );
  }

  const isLoading = eventsQuery.isLoading || statsQuery.isLoading;
  const events = (eventsQuery.data?.events ?? []).filter(
    (e) => typeFilter === 'all' || e.eventType === typeFilter,
  );
  const stats = statsQuery.data?.stats;

  const weekdayData: BarDatum[] = (stats?.weekday ?? [0, 0, 0, 0, 0, 0, 0]).map((v, i) => ({
    label: WEEKDAY_LABELS[i],
    value: v,
    color: C.primary,
  }));

  const typeBars = (stats?.byType ?? []).map((t) => ({
    label: EVENT_TYPE_LABELS[t.type as HealthEventType] ?? t.type,
    value: t.count,
  }));

  const topDescriptions = (stats?.topDescriptions ?? []).slice(0, 5).map((d) => ({
    label: d.text.length > 36 ? `${d.text.slice(0, 33)}…` : d.text,
    value: d.count,
  }));

  function handleSave() {
    setFormError(null);
    if (!formDescription.trim()) {
      setFormError('A descrição não pode estar vazia.');
      return;
    }
    const eventDate = new Date(formDate);
    if (Number.isNaN(eventDate.getTime())) {
      setFormError('Data/hora inválida.');
      return;
    }
    createEvent.mutate({
      eventType: formType,
      inputType: 'text',
      descriptionText: formDescription.trim(),
      eventDatetime: eventDate.toISOString(),
    });
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              eventsQuery.refetch();
              statsQuery.refetch();
            }}
            tintColor={C.primary}
          />
        }
      >
        <Text style={styles.pageTitle}>Anotar Sintoma</Text>
        <Text style={styles.subtitle}>Suas anotações de sintomas, cefaleia, sono e convulsões</Text>

        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodChip, days === p.value && styles.periodChipActive]}
              onPress={() => setDays(p.value)}
            >
              <Text
                style={[styles.periodChipText, days === p.value && styles.periodChipTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeChips}
        >
          {TYPE_FILTERS.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeChip,
                typeFilter === t.value && styles.typeChipActive,
              ]}
              onPress={() => setTypeFilter(t.value)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  typeFilter === t.value && styles.typeChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {stats && (
          <Card title="Resumo do período" icon="chart-bar">
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totals.count}</Text>
                <Text style={styles.statLabel}>Anotações</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totals.distinctDays}</Text>
                <Text style={styles.statLabel}>Dias distintos</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totals.averagePerWeek.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Por semana</Text>
              </View>
            </View>
          </Card>
        )}

        {stats && (
          <Card title="Distribuição por tipo" icon="tag-outline">
            {typeBars.length > 0 ? (
              <HBars data={typeBars} color={C.primary} />
            ) : (
              <Text style={styles.muted}>Nenhuma anotação no período.</Text>
            )}
          </Card>
        )}

        {stats && (
          <Card title="Dias da semana" icon="calendar-week">
            <BarChart data={weekdayData} height={100} />
          </Card>
        )}

        {stats && topDescriptions.length > 0 && (
          <Card title="Anotações mais frequentes" icon="repeat">
            <HBars data={topDescriptions} color={C.primary} />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Histórico</Text>
        {events.length === 0 ? (
          <Text style={styles.muted}>Nenhuma anotação no período selecionado.</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventDate}>{formatDateTime(item.eventDatetime)}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          (EVENT_TYPE_COLORS[item.eventType] ?? C.muted) + '22',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: EVENT_TYPE_COLORS[item.eventType] ?? C.muted },
                      ]}
                    >
                      {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
                    </Text>
                  </View>
                </View>
                {item.descriptionText ? (
                  <Text style={styles.eventText}>{item.descriptionText}</Text>
                ) : null}
              </View>
            )}
          />
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setFormType(typeFilter === 'all' ? 'symptom' : typeFilter);
          setFormDate(toLocalDatetimeInput(new Date()));
          setFormDescription('');
          setFormError(null);
          setFormOpen(true);
        }}
      >
        <Text style={styles.fabText}>+ Nova</Text>
      </TouchableOpacity>

      <Modal
        visible={formOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFormOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova anotação</Text>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.modalChips}>
              {(Object.keys(EVENT_TYPE_LABELS) as HealthEventType[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.modalChip,
                    formType === k && {
                      backgroundColor: EVENT_TYPE_COLORS[k],
                      borderColor: EVENT_TYPE_COLORS[k],
                    },
                  ]}
                  onPress={() => setFormType(k)}
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      formType === k && styles.modalChipTextActive,
                    ]}
                  >
                    {EVENT_TYPE_LABELS[k]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Quando</Text>
            <TextInput
              style={styles.input}
              value={formDate}
              onChangeText={setFormDate}
              placeholder="AAAA-MM-DDTHH:MM"
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="Ex: Dor de cabeça leve, lado direito…"
              multiline
              maxLength={2000}
            />

            {formError && <Text style={styles.errorText}>{formError}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setFormOpen(false)}
                disabled={createEvent.isPending}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSave}
                disabled={createEvent.isPending}
              >
                <Text style={styles.btnPrimaryText}>
                  {createEvent.isPending ? 'Salvando…' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, paddingBottom: 96 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginBottom: 12 },
  muted: { color: C.muted, fontSize: 13 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginTop: 16,
    marginBottom: 8,
  },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
  },
  periodChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  periodChipText: { fontSize: 13, color: C.muted, fontWeight: '600' },
  periodChipTextActive: { color: C.onPrimary, fontWeight: '700' },
  typeChips: { gap: 8, paddingBottom: 12, paddingRight: 16 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  typeChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeChipText: { fontSize: 13, color: C.muted, fontWeight: '600' },
  typeChipTextActive: { color: C.onPrimary, fontWeight: '700' },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: C.border },
  eventCard: {
    backgroundColor: C.surface,
    borderRadius: T.radius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.color.border,
    ...T.shadow.soft,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDate: { fontSize: 13, fontWeight: '600', color: C.text },
  eventText: { fontSize: 14, color: C.text, fontStyle: 'italic', marginTop: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: C.primary,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: C.onPrimary, fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 },
  label: { fontSize: 12, color: C.muted, marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.bg,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  modalChipText: { fontSize: 13, color: C.muted, fontWeight: '600' },
  modalChipTextActive: { color: C.onPrimary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  btnSecondaryText: { color: C.muted, fontWeight: '600' },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  btnPrimaryText: { color: C.onPrimary, fontWeight: '700' },
  errorText: { color: '#C0392B', fontSize: 13, marginTop: 12 },
});
