import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { uploadFileViaSignedUrl } from '../lib/upload';
import type { PatientRecipesResponse, RecipeRequest, RecipesResponse } from '../types';

interface RecipesPanelProps {
  /** Se fornecido: foca nas receitas deste paciente.
   *  Se null: modo médico global (todas pendentes). */
  patientId: string | null;
  patientName?: string;
  /** Papel de quem está vendo. 'patient' mostra formulário de solicitação;
   *  'doctor' mostra apenas lista + botão de responder. */
  role: 'patient' | 'doctor';
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

/** Modal de detalhe da receita para o médico: ver dados + enviar receita em PDF. */
function RecipeDetailModal({
  recipe,
  onClose,
}: {
  recipe: RecipeRequest;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione o arquivo da receita (PDF ou imagem).');
      // 1. Upload do PDF/receita para o Storage
      const { storagePath } = await uploadFileViaSignedUrl(
        `/patients/${recipe.patientId}/documents/sign-upload`,
        { documentType: 'recipe' },
        file,
      );
      // 2. Registra documento vinculado ao paciente
      await apiPost(`/patients/${recipe.patientId}/documents`, {
        storagePath,
        documentType: 'recipe',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      });
      // 3. Marca receita como respondida
      await apiPatch(`/recipes/${recipe.id}/respond`, {});
    },
    onSuccess: () => onClose(),
    onError: (e) => setErr(e instanceof Error ? e.message : 'Erro ao enviar receita.'),
  });

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Receita — {recipe.patient?.user.fullName ?? 'paciente'}</h3>
          <button className="btn-ghost small" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="recipe-detail-row">
            <strong>Medicamentos:</strong>
            <span>{recipe.medicationNames.length ? recipe.medicationNames.join(', ') : '(sem medicamentos)'}</span>
          </div>
          {recipe.reason && (
            <div className="recipe-detail-row">
              <strong>Motivo:</strong>
              <span>{recipe.reason}</span>
            </div>
          )}
          {recipe.quantityDays && (
            <div className="recipe-detail-row">
              <strong>Quantidade:</strong>
              <span>{recipe.quantityDays} dias</span>
            </div>
          )}
          <div className="recipe-detail-row">
            <strong>Prazo:</strong>
            <span>{slaInfo(recipe.slaDeadline)}</span>
          </div>
          <div className="recipe-detail-row">
            <strong>Status:</strong>
            <span className={`tag ${STATUS_TAG[recipe.status]}`}>{STATUS_LABEL[recipe.status]}</span>
          </div>

          <hr style={{ margin: '16px 0', borderColor: 'rgba(0,0,0,0.08)' }} />

          <label>
            Arquivo da receita (PDF, JPG ou PNG)
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Observação para o paciente (opcional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Tomar após almoço por 30 dias."
            />
          </label>

          {err && <div className="auth-error">{err}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn-primary"
              disabled={send.isPending}
              onClick={() => send.mutate()}
            >
              {send.isPending ? 'Enviando…' : 'Enviar receita e marcar como respondida'}
            </button>
            <button className="btn-ghost" onClick={onClose} disabled={send.isPending}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipesPanel({ patientId, patientName, role }: RecipesPanelProps) {
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
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Modo médico sem paciente selecionado: lista todas as suas receitas pendentes
  const doctorRecipesQuery = useQuery({
    queryKey: ['recipes', 'doctor'],
    queryFn: () => apiGet<RecipesResponse>('/recipes?status=pending'),
    enabled: !patientId && role === 'doctor',
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
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

  const [openRecipe, setOpenRecipe] = useState<RecipeRequest | null>(null);

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
      {patientId && role === 'patient' && (
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
            {/* Médico: ao clicar, abre modal com upload de receita em anexo */}
            {role === 'doctor' && r.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={() => setOpenRecipe(r)}
                >
                  Abrir e enviar receita
                </button>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  disabled={respondRecipe.isPending}
                  onClick={() => {
                    if (confirm('Marcar como respondida sem anexar arquivo?')) {
                      respondRecipe.mutate(r.id);
                    }
                  }}
                >
                  Marcar sem anexo
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {openRecipe && (
        <RecipeDetailModal recipe={openRecipe} onClose={() => {
          setOpenRecipe(null);
          queryClient.invalidateQueries({ queryKey: ['recipes', 'doctor'] });
          queryClient.invalidateQueries({ queryKey: ['recipes', 'patient'] });
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }} />
      )}
    </section>
  );
}
