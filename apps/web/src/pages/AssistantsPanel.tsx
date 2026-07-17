import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import type {
  Assistant,
  AssistantPermissions,
  AssistantsResponse,
  CreateAssistantInput,
  CreateAssistantResponse,
} from '../types';

const PERMISSION_LABELS: Record<keyof AssistantPermissions, string> = {
  can_view: 'Visualizar pacientes',
  can_respond: 'Responder demandas e chat',
  can_approve_recipes: 'Aprovar receitas',
};

const onlyDigits = (s: string) => s.replace(/\D/g, '');

interface NewAssistantForm {
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  initialPassword: string;
  perms: AssistantPermissions;
}

const DEFAULT_PERMS: AssistantPermissions = {
  can_view: true,
  can_respond: false,
  can_approve_recipes: false,
};

export function AssistantsPanel() {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Assistant | null>(null);
  const [form, setForm] = useState<NewAssistantForm>({
    email: '',
    fullName: '',
    cpf: '',
    phone: '',
    initialPassword: '',
    perms: DEFAULT_PERMS,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreateAssistantResponse | null>(null);

  const assistantsQuery = useQuery({
    queryKey: ['assistants'],
    queryFn: () => apiGet<AssistantsResponse>('/assistants'),
  });

  const createAssistant = useMutation({
    mutationFn: () => {
      const payload: CreateAssistantInput = {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        cpf: onlyDigits(form.cpf),
        phone: onlyDigits(form.phone),
        initialPassword: form.initialPassword,
        permissions: form.perms,
      };
      return apiPost<CreateAssistantResponse>('/assistants', payload);
    },
    onSuccess: (data) => {
      setLastCreated(data);
      setFormError(null);
      setForm({
        email: '',
        fullName: '',
        cpf: '',
        phone: '',
        initialPassword: '',
        perms: DEFAULT_PERMS,
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : 'Erro ao criar assistente.'),
  });

  const updatePermissions = useMutation({
    mutationFn: (params: { id: string; permissions: AssistantPermissions }) =>
      apiPatch(`/assistants/${params.id}/permissions`, { permissions: params.permissions }),
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
    },
  });

  const removeAssistant = useMutation({
    mutationFn: (id: string) => apiDelete(`/assistants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
    },
  });

  const toggleEditPermission = (
    assistant: Assistant,
    key: keyof AssistantPermissions,
    value: boolean,
  ) => {
    updatePermissions.mutate({
      id: assistant.id,
      permissions: { ...assistant.permissions, [key]: value },
    });
  };

  return (
    <section className="card">
      <h2>
        Assistentes{' '}
        {assistantsQuery.data && <span className="badge">{assistantsQuery.data.assistants.length}</span>}
      </h2>

      {assistantsQuery.isLoading && <p className="muted">Carregando…</p>}
      {assistantsQuery.isError && <p className="auth-error">Erro ao carregar assistentes.</p>}

      {lastCreated && (
        <div className="credentials-box">
          <strong>{lastCreated.assistant.user.fullName} foi adicionado(a)</strong>
          <p>Informe ao assistente as credenciais de acesso ao painel:</p>
          <div className="credentials-row">
            <span className="cred-label">E-mail (login):</span>
            <code>{lastCreated.credentials.email}</code>
          </div>
          <div className="credentials-row">
            <span className="cred-label">Senha inicial:</span>
            <code>{lastCreated.credentials.password}</code>
          </div>
          <p className="muted small">{lastCreated.credentials.hint}</p>
          <button className="btn-ghost small" onClick={() => setLastCreated(null)}>
            Fechar
          </button>
        </div>
      )}

      {assistantsQuery.data && assistantsQuery.data.assistants.length === 0 && !showForm && (
        <p className="muted">Nenhum assistente vinculado. Adicione um para começar.</p>
      )}

      {assistantsQuery.data && assistantsQuery.data.assistants.length > 0 && (
        <ul className="patient-list">
          {assistantsQuery.data.assistants.map((a) => (
            <li key={a.id} className="assistant-item">
              <div className="assistant-header">
                <div>
                  <strong>{a.user.fullName}</strong>
                  <div className="muted small">
                    {a.user.email ?? '(sem e-mail)'} · {a.user.cpf} · {a.user.phone}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost small"
                  onClick={() => {
                    if (window.confirm(`Remover o assistente ${a.user.fullName}?`)) {
                      removeAssistant.mutate(a.id);
                    }
                  }}
                  disabled={removeAssistant.isPending}
                >
                  Remover
                </button>
              </div>

              <div className="assistant-perms">
                {(Object.keys(PERMISSION_LABELS) as (keyof AssistantPermissions)[]).map((key) => (
                  <label key={key} className="assistant-perm-row">
                    <input
                      type="checkbox"
                      checked={editing?.id === a.id ? editing.permissions[key] : a.permissions[key]}
                      disabled={
                        editing?.id !== a.id && updatePermissions.isPending
                      }
                      onChange={(e) => {
                        if (editing?.id === a.id) {
                          setEditing({
                            ...editing,
                            permissions: { ...editing.permissions, [key]: e.target.checked },
                          });
                        } else {
                          toggleEditPermission(a, key, e.target.checked);
                        }
                      }}
                    />
                    <span>{PERMISSION_LABELS[key]}</span>
                  </label>
                ))}
                {editing?.id === a.id && (
                  <div className="assistant-perm-actions">
                    <button
                      className="btn-primary small"
                      onClick={() =>
                        updatePermissions.mutate({
                          id: a.id,
                          permissions: editing.permissions,
                        })
                      }
                      disabled={updatePermissions.isPending}
                    >
                      Salvar
                    </button>
                    <button
                      className="btn-ghost small"
                      onClick={() => setEditing(null)}
                      disabled={updatePermissions.isPending}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormError(null);
          }}
        >
          + Adicionar assistente
        </button>
      ) : (
        <form
          className="patient-form"
          style={{ marginTop: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            setLastCreated(null);
            createAssistant.mutate();
          }}
        >
          <label>
            Nome completo
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </label>
          <div className="row">
            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              CPF
              <input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="00000000000"
                required
              />
            </label>
          </div>
          <div className="row">
            <label>
              Telefone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="5583988001234"
                required
              />
            </label>
            <label>
              Senha inicial
              <input
                type="text"
                value={form.initialPassword}
                onChange={(e) => setForm({ ...form, initialPassword: e.target.value })}
                minLength={8}
                maxLength={72}
                required
                title="Senha temporária — o assistente deverá trocá-la no 1º acesso."
              />
            </label>
          </div>

          <fieldset className="assistant-perms-fieldset">
            <legend>Permissões</legend>
            {(Object.keys(PERMISSION_LABELS) as (keyof AssistantPermissions)[]).map((key) => (
              <label key={key} className="assistant-perm-row">
                <input
                  type="checkbox"
                  checked={form.perms[key]}
                  onChange={(e) =>
                    setForm({ ...form, perms: { ...form.perms, [key]: e.target.checked } })
                  }
                />
                <span>{PERMISSION_LABELS[key]}</span>
              </label>
            ))}
          </fieldset>

          {formError && <div className="auth-error">{formError}</div>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn-primary" type="submit" disabled={createAssistant.isPending}>
              {createAssistant.isPending ? 'Salvando…' : 'Adicionar assistente'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              disabled={createAssistant.isPending}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
