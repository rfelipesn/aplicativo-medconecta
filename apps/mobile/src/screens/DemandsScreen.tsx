import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import type { Demand, DemandsResponse, MeResponse } from '../types';
import {
  DEMAND_TYPES,
  DEMAND_TYPE_LABELS,
  DEMAND_PRIORITY_LABELS,
  DEMAND_STATUS_LABELS,
  type DemandType,
} from '@medconecta/shared';

import { T } from '../theme/tokens';

const C = {
  primary: T.color.primary,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  border: T.color.separator,
  // status colors
  openColor: '#2E6B73',
  openBg: '#EAF4F5',
  respondedColor: '#1E8449',
  respondedBg: '#D5F5E3',
  pendingColor: '#856404',
  pendingBg: '#FEF3CD',
  closedColor: '#7F8C8D',
  closedBg: '#F2F3F4',
  // priority colors
  urgentColor: '#C0392B',
  urgentBg: '#FADBD8',
  electiveColor: '#2E6B73',
  electiveBg: '#EAF4F5',
  informationalColor: '#7F8C8D',
  informationalBg: '#F2F3F4',
  otherColor: '#7F8C8D',
  otherBg: '#F2F3F4',
};

const DEMAND_TYPE_ICONS: Record<DemandType, string> = {
  recipe_renewal: '💊',
  appointment_request: '📅',
  exam_result: '🔬',
  symptom_log: '🩺',
  general_question: '❓',
  second_opinion: '👥',
};

function statusColors(status: Demand['status']) {
  switch (status) {
    case 'open':
      return { color: C.openColor, bg: C.openBg };
    case 'responded':
      return { color: C.respondedColor, bg: C.respondedBg };
    case 'pending_action':
      return { color: C.pendingColor, bg: C.pendingBg };
    case 'closed':
    default:
      return { color: C.closedColor, bg: C.closedBg };
  }
}

function priorityColors(priority: NonNullable<Demand['priority']>) {
  switch (priority) {
    case 'urgent':
      return { color: C.urgentColor, bg: C.urgentBg };
    case 'elective':
      return { color: C.electiveColor, bg: C.electiveBg };
    case 'informational':
      return { color: C.informationalColor, bg: C.informationalBg };
    case 'other':
    default:
      return { color: C.otherColor, bg: C.otherBg };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DemandCard({
  item,
  onClose,
}: {
  item: Demand;
  onClose: (id: string) => void;
}) {
  const sColors = statusColors(item.status);
  const typeLabel = DEMAND_TYPE_LABELS[item.type] ?? item.type;
  const icon = DEMAND_TYPE_ICONS[item.type] ?? '📋';
  const canClose = item.status === 'open' || item.status === 'pending_action';
  const preview =
    (item.title && item.title.trim()) ||
    (item.description && item.description.slice(0, 80)) ||
    'Sem descrição';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Text style={styles.typeIcon}>{icon}</Text>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: sColors.bg }]}>
          <Text style={[styles.tagText, { color: sColors.color }]}>
            {DEMAND_STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {preview}
      </Text>

      {item.description && (
        <Text style={styles.cardDesc} numberOfLines={3}>
          {item.description}
        </Text>
      )}

      {item.status === 'responded' && item.responseNotes && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Resposta do médico:</Text>
          <Text style={styles.responseText}>{item.responseNotes}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        {item.priority && (
          <View
            style={[styles.badge, { backgroundColor: priorityColors(item.priority).bg }]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: priorityColors(item.priority).color },
              ]}
            >
              {DEMAND_PRIORITY_LABELS[item.priority] ?? item.priority}
            </Text>
          </View>
        )}
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>

      {canClose && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => onClose(item.id)}
        >
          <Text style={styles.closeBtnText}>Fechar demanda</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function DemandsScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<DemandType>('general_question');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const demandsQuery = useQuery({
    queryKey: ['demands', patientId],
    queryFn: () => apiGet<DemandsResponse>(`/patients/${patientId}/demands`),
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<{ ok: true; demand: Demand }>('/demands', {
        type,
        title: title.trim() || undefined,
        description: description.trim(),
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setType('general_question');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['demands', patientId] });
      Alert.alert('Demanda enviada', 'Sua solicitação foi registrada com sucesso.');
    },
    onError: (err) =>
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao enviar demanda.'),
  });

  const closeMutation = useMutation({
    mutationFn: (demandId: string) =>
      apiPatch(`/demands/${demandId}/status`, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands', patientId] });
      Alert.alert('Demanda fechada', 'A solicitação foi encerrada.');
    },
    onError: (err) =>
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao fechar demanda.'),
  });

  const demands = demandsQuery.data?.demands ?? [];
  const canSubmit = description.trim().length > 0 && !createMutation.isPending;

  const handleClose = (id: string) => {
    Alert.alert(
      'Fechar demanda',
      'Deseja encerrar esta solicitação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Fechar', style: 'destructive', onPress: () => closeMutation.mutate(id) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={demands}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => setShowForm((v) => !v)}
            >
              <Text style={styles.newBtnText}>
                {showForm ? 'Cancelar' : '+ Nova demanda'}
              </Text>
            </TouchableOpacity>

            {showForm && (
              <View style={styles.form}>
                <Text style={styles.label}>Tipo de solicitação</Text>
                <View style={styles.chipRow}>
                  {DEMAND_TYPES.map((t) => {
                    const active = t === type;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setType(t)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {DEMAND_TYPE_ICONS[t]} {DEMAND_TYPE_LABELS[t]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Título (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={(v) => setTitle(v.slice(0, 200))}
                  placeholder="Resumo curto da solicitação"
                  placeholderTextColor={C.muted}
                  maxLength={200}
                />

                <Text style={styles.label}>Descrição (obrigatório)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={(v) => setDescription(v.slice(0, 2000))}
                  placeholder="Descreva sua solicitação em detalhes…"
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, !canSubmit && { opacity: 0.6 }]}
                  onPress={() => canSubmit && createMutation.mutate()}
                  disabled={!canSubmit}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Enviar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Minhas demandas {demands.length > 0 ? `(${demands.length})` : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          demandsQuery.isLoading ? (
            <ActivityIndicator color={C.primary} style={{ margin: 16 }} />
          ) : demandsQuery.isError ? (
            <Text style={styles.muted}>Erro ao carregar demandas.</Text>
          ) : (
            <Text style={styles.muted}>
              Nenhuma demanda ainda. Crie sua primeira solicitação.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <DemandCard item={item} onClose={handleClose} />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  newBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  newBtnText: { color: C.onPrimary, fontWeight: '700', fontSize: 15 },
  form: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  label: { fontSize: 13, color: C.muted, marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
  chipTextActive: { color: C.onPrimary, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: C.text,
    marginBottom: 14,
  },
  textArea: { minHeight: 96, paddingTop: 12 },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: C.onPrimary, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeIcon: { fontSize: 18, marginRight: 6 },
  typeLabel: { fontSize: 13, color: C.muted, fontWeight: '500' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: C.muted, marginBottom: 8 },
  responseBox: {
    backgroundColor: C.respondedBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.respondedColor,
  },
  responseLabel: { fontSize: 12, fontWeight: '700', color: C.respondedColor, marginBottom: 2 },
  responseText: { fontSize: 13, color: C.text },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  tag: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 12, color: C.muted },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  closeBtnText: { color: C.muted, fontSize: 13, fontWeight: '500' },
  muted: { color: C.muted, textAlign: 'center', marginTop: 8 },
});
