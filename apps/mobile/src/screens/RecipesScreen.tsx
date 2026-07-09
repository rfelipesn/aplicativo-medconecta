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
import { apiGet, apiPost } from '../lib/api';
import type { MeResponse, RecipeRequest, RecipesResponse } from '../types';
import { BUSINESS_RULES } from '@medconecta/shared';

import { T } from '../theme/tokens';

const C = {
  primary: T.color.primary,
  onPrimary: T.color.onPrimary,
  bg: T.color.bg,
  surface: T.color.surface,
  text: T.color.text,
  muted: T.color.textSecondary,
  border: T.color.separator,
  pending: '#856404',
  pendingBg: '#FEF3CD',
  responded: '#1E8449',
  respondedBg: '#D5F5E3',
  expired: '#7F8C8D',
  expiredBg: '#F2F3F4',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  responded: 'Respondida',
  expired: 'Expirada',
};

function slaInfo(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Prazo vencido';
  const h = Math.floor(diff / 3_600_000);
  return h < 24 ? `${h}h restantes` : `${Math.floor(h / 24)}d restantes`;
}

function RecipeCard({ item }: { item: RecipeRequest }) {
  const color =
    item.status === 'pending' ? C.pending : item.status === 'responded' ? C.responded : C.expired;
  const bg =
    item.status === 'pending'
      ? C.pendingBg
      : item.status === 'responded'
        ? C.respondedBg
        : C.expiredBg;

  return (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle}>
          {item.medicationNames.length ? item.medicationNames.join(', ') : 'Sem medicamentos'}
        </Text>
        <View style={[styles.tag, { backgroundColor: bg }]}>
          <Text style={[styles.tagText, { color }]}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>
      {item.quantityDays && (
        <Text style={styles.recipeMeta}>{item.quantityDays} dias</Text>
      )}
      {item.reason && <Text style={styles.recipeMeta}>Motivo: {item.reason}</Text>}
      {item.status === 'pending' && (
        <Text style={[styles.recipeMeta, { color: C.pending }]}>{slaInfo(item.slaDeadline)}</Text>
      )}
    </View>
  );
}

export function RecipesScreen() {
  const queryClient = useQueryClient();
  const [medications, setMedications] = useState('');
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;

  const recipesQuery = useQuery({
    queryKey: ['recipes', patientId],
    queryFn: () => apiGet<RecipesResponse>(`/patients/${patientId}/recipes`),
    enabled: !!patientId,
  });

  const request = useMutation({
    mutationFn: () =>
      apiPost(`/patients/${patientId}/recipes`, {
        medicationNames: medications
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      setMedications('');
      setReason('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['recipes', patientId] });
      Alert.alert('Sucesso', `Receita solicitada. Prazo: ${BUSINESS_RULES.RECIPE_SLA_HOURS}h.`);
    },
    onError: (err) => Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao solicitar.'),
  });

  const recipes = recipesQuery.data?.recipes ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => setShowForm((v) => !v)}
            >
              <Text style={styles.newBtnText}>
                {showForm ? 'Cancelar' : '+ Nova solicitação'}
              </Text>
            </TouchableOpacity>

            {showForm && (
              <View style={styles.form}>
                <Text style={styles.label}>Medicamentos (separados por vírgula)</Text>
                <TextInput
                  style={styles.input}
                  value={medications}
                  onChangeText={setMedications}
                  placeholder="Ex: Topamax 100mg, Depakote 500mg"
                  placeholderTextColor={C.muted}
                />
                <Text style={styles.label}>Motivo (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Renovação de uso contínuo"
                  placeholderTextColor={C.muted}
                />
                <TouchableOpacity
                  style={[styles.submitBtn, request.isPending && { opacity: 0.6 }]}
                  onPress={() => { if (medications.trim()) request.mutate(); }}
                  disabled={request.isPending || !medications.trim()}
                >
                  {request.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Solicitar receita</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Minhas solicitações {recipes.length > 0 ? `(${recipes.length})` : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !recipesQuery.isLoading ? (
            <Text style={styles.muted}>Nenhuma solicitação ainda.</Text>
          ) : (
            <ActivityIndicator color={C.primary} style={{ margin: 16 }} />
          )
        }
        renderItem={({ item }) => <RecipeCard item={item} />}
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
  label: { fontSize: 13, color: C.muted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: C.text,
    marginBottom: 14,
  },
  submitBtn: { backgroundColor: C.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  submitBtnText: { color: C.onPrimary, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  recipeCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1, marginRight: 8 },
  tag: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: '600' },
  recipeMeta: { fontSize: 13, color: C.muted, marginTop: 2 },
  muted: { color: C.muted, textAlign: 'center', marginTop: 8 },
});
