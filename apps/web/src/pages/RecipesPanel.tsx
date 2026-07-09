import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import type { PatientRecipesResponse, RecipesResponse } from '../types';

interface RecipesPanelProps {
  /** Se fornecido: modo paciente — solicitar + listar receitas do próprio paciente.
   *  Se null: modo médico — ver todas as receitas pendentes da sua lista. */
  patientId: string | null;
  patientName?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  responded: 'Respondida',
  expired: 'Expirada',
};
const STATUS_TAG: Record<string, string> = {
  pending: 'tag--pending',
  responded: 'tag--active',
  expired: 'tag--inactive',
};

function slaInfo(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Prazo vencido';
  const h = Math.floor(diff / 3600000);
  return h < 24 ? `${h}h restantes` : `${Math.floor(h / 24)}d restantes`;
}

export function RecipesPanel({ patientId, patientName }: RecipesPanelProps) {
  const queryClient = useQueryClient();
  const [medications, setMedications] = useState('');
  const [reason, setReason] = useState('');
  const [quantity, setQuantity] = useState<30 | 60 | 90 | ''>('');
  const [formErr, setFormErr] = useState<string | null>(null);

  // Modo paciente: lista receitas do seu patientId
  const patientRecipesQuery = useQuery({
    queryKey: ['recipes', 'patient', patientId],
    queryFn: () => apiGet<PatientRecipesResponse>(`/patients/${patientId}/recipes`),
    enabled: !!patientId,
  });

  // Modo médico: lista todas as suas receitas
  const doctorRecipesQuery = useQuery({
    queryKey: ['recipes', 'doctor'],
    queryFn: () => apiGet<RecipesResponse>('/recipes?status=pending'),
    enabled: !patientId,
  });

  const requestRecipe = useMutation({
    mutationFn: () =>
      apiPost(`/patients/${patientId}/recipes`, {
        medicationNames: medications
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        quantityDays: quantity || undefined,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      setMedications('');
      setReason('');
      setQuantity('');
      setFormErr(null);
      queryClient.invalidateQueries({ queryKey: ['recipes', 'patient', patientId] });
    },
    onError: (err) => setFormErr(err instanceof Error ? err.message : 'Erro ao solicitar.'),
  });

  const respondRecipe = useMutation({
    mutationFn: (recipeId: string) => apiPatch(`/recipes/${recipeId}/respond`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', 'doctor'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', 'patient'] });
    },
  });

  const recipes = patientId
    ? patientRecipesQuery.data?.recipes ?? []
    : doctorRecipesQuery.data?.recipes ?? [];

  const isLoading = patientId ? patientRecipesQuery.isLoading : doctorRecipesQuery.isLoading;

  return (
    <section className="card">
      <h2>
        {patientId ? `Receitas — ${patientName ?? ''}` : 'Receitas pendentes'}
        <span className="badge">{recipes.length}</span>
      </h2>

      {/* Formulário de solicitação — só no modo paciente */}
      {patientId && (
        <form
          className="patient-form"
          style={{ marginBottom: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            requestRecipe.mutate();
          }}
        >
          <label>
            Medicamentos (separados por vírgula)
            <input
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="Ex: Topamax 100mg, Depakote 500mg"
              required
            />
          </label>
          <div className="row">
            <label>
              Quantidade (dias)
              <select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value as 30 | 60 | 90 | '')}
              >
                <option value="">Não informar</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </label>
          </div>
          <label>
            Motivo (opcional)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Renovação de uso contínuo"
            />
          </label>
          {formErr && <div className="auth-error">{formErr}</div>}
          <button className="btn-primary" type="submit" disabled={requestRecipe.isPending}>
            {requestRecipe.isPending ? 'Enviando…' : 'Solicitar receita'}
          </button>
        </form>
      )}

      {isLoading && <p className="muted">Carregando…</p>}
      {!isLoading && recipes.length === 0 && (
        <p className="muted">
          {patientId ? 'Nenhuma solicitação ainda.' : 'Sem receitas pendentes.'}
        </p>
      )}

      <ul className="patient-list">
        {recipes.map((r) => (
          <li key={r.id} className="patient-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <strong>
                {r.medicationNames.length ? r.medicationNames.join(', ') : '(sem medicamentos)'}
              </strong>
              <span className={`tag ${STATUS_TAG[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            {r.patient && <div className="muted small">Paciente: {r.patient.user.fullName}</div>}
            {r.reason && <div className="muted small">Motivo: {r.reason}</div>}
            {r.quantityDays && <div className="muted small">{r.quantityDays} dias</div>}
            {r.status === 'pending' && (
              <div className="muted small">{slaInfo(r.slaDeadline)}</div>
            )}
            {/* Médico pode marcar como respondida */}
            {!patientId && r.status === 'pending' && (
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 12px', marginTop: 4 }}
                disabled={respondRecipe.isPending}
                onClick={() => respondRecipe.mutate(r.id)}
              >
                Marcar como respondida
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
