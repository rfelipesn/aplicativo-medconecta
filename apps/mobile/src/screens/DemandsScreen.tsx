import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
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
  DEMAND_TYPE_LABELS,
  DEMAND_PRIORITY_LABELS,
  DEMAND_STATUS_LABELS,
  type DemandType,
} from '@medconecta/shared';

import { T } from '../theme/tokens';
import { IconSquircle, type FluentIconName } from '../components/FluentIcon';

const C = {
  primary: T.color.primaryStrong,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  border: T.color.separator,
  // status colors
  openColor: T.color.primaryDark,
  openBg: T.color.primarySoft,
  respondedColor: '#167D55',
  respondedBg: T.color.greenSoft,
  pendingColor: '#9A6118',
  pendingBg: T.color.orangeSoft,
  closedColor: T.color.textSecondary,
  closedBg: T.color.surfaceMuted,
  // priority colors
  urgentColor: '#AE3030',
  urgentBg: T.color.redSoft,
  electiveColor: T.color.primaryDark,
  electiveBg: T.color.primarySoft,
  informationalColor: '#2569AE',
  informationalBg: T.color.blueSoft,
  otherColor: T.color.textSecondary,
  otherBg: T.color.surfaceMuted,
};

const DEMAND_TYPE_ICONS: Record<DemandType, FluentIconName> = {
  recipe_renewal: 'pill',
  appointment_request: 'calendar-clock-outline',
  exam_result: 'flask-outline',
  symptom_log: 'stethoscope',
  general_question: 'message-question-outline',
  second_opinion: 'account-group-outline',
};

/**
 * Tipos de demanda que o paciente pode criar no app.
 * "Pergunta geral" e "Segunda opinião" são fluxos internos do médico,
 * não expostos ao paciente.
 */
const PATIENT_DEMAND_TYPES: DemandType[] = [
  'recipe_renewal',
  'appointment_request',
];

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
  const icon = DEMAND_TYPE_ICONS[item.type] ?? 'clipboard-text-outline';
  const canClose = item.status === 'open' || item.status === 'pending_action';
  const preview =
    (item.title && item.title.trim()) ||
    (item.description && item.description.slice(0, 80)) ||
    'Sem descrição';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <IconSquircle name={icon} size={38} />
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
  const [type, setType] = useState<DemandType>('recipe_renewal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const demandsQuery = useQuery({
    queryKey: ['demands', patientId],
    queryFn: () => apiGet<DemandsResponse>(`/patients/${patientId}/demands`),
    enabled: !!patientId,
    // Médico responde em outra sessão; paciente precisa ver status sem reabrir o app.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost<{ ok: true; demand: Demand }>('/demands', {
        type,
        title: title.trim() || undefined,
        description: description.trim(),
      });
      return res;
    },
    onSuccess: (data) => {
      setTitle('');
      setDescription('');
      setType('recipe_renewal');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['demands', patientId] });

      // Para solicitações de agendamento, abre o WhatsApp com mensagem pronta
      // (se houver número configurado).
      if (type === 'appointment_request') {
        const whatsappNumber = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '';
        const patientName = meQuery.data?.user.fullName ?? '';
        if (whatsappNumber) {
          const msg = encodeURIComponent(
            `Olá! Sou ${patientName} e gostaria de agendar uma consulta. (Demanda #${data.demand?.id ?? ''})`,
          );
          Linking.openURL(`https://wa.me/${whatsappNumber}?text=${msg}`).catch(() => {
            /* usuário pode não ter WhatsApp instalado */
          });
          Alert.alert(
            'Demanda enviada',
            'Sua solicitação foi registrada. Abrindo o WhatsApp para confirmar o agendamento.',
          );
          return;
        }
      }

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
                  {PATIENT_DEMAND_TYPES.map((t) => {
                    const active = t === type;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setType(t)}
                      >
                        <IconSquircle
                          name={DEMAND_TYPE_ICONS[t]}
                          size={20}
                          color={active ? C.onPrimary : C.primary}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {DEMAND_TYPE_LABELS[t]}
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
                    <ActivityIndicator color={C.onPrimary} />
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
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12, paddingBottom: 32 },
  newBtn: {
    backgroundColor: C.primary,
    borderRadius: T.radius.md,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  newBtnText: { color: C.onPrimary, fontWeight: '700', fontSize: 15 },
  form: {
    backgroundColor: T.color.acrylicStrong,
    borderRadius: T.radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.color.border,
    ...T.shadow.card,
  },
  label: { fontSize: 13, color: C.muted, marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: T.color.surfaceSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
  chipTextActive: { color: C.onPrimary, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: T.radius.md,
    padding: 12,
    fontSize: 14,
    color: C.text,
    marginBottom: 14,
    backgroundColor: T.color.surfaceSubtle,
  },
  textArea: { minHeight: 96, paddingTop: 12 },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: T.radius.md,
    padding: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: C.onPrimary, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: T.color.primary, paddingLeft: 8 },
  card: {
    backgroundColor: T.color.acrylicStrong,
    borderRadius: T.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: T.color.border,
    ...T.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeLabel: { fontSize: 13, color: C.text, fontWeight: '700', marginLeft: 9 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: C.muted, marginBottom: 8 },
  responseBox: {
    backgroundColor: C.respondedBg,
    borderRadius: T.radius.md,
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
