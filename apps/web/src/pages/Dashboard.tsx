import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { apiGet, apiPost } from '../lib/api';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';
import type { MeResponse, NotificationsResponse, PatientListItem, PatientsResponse } from '../types';
import { ChatPanel } from './ChatPanel';
import { RecipesPanel } from './RecipesPanel';
import { ExamsPanel } from './ExamsPanel';
import { DocumentsPanel } from './DocumentsPanel';
import { HeadachePanel } from './HeadachePanel';
import { SeizurePanel } from './SeizurePanel';
import { DemandsPanel } from './DemandsPanel';
import { AssistantsPanel } from './AssistantsPanel';
import { HealthEventPanel } from './HealthEventPanel';

const onlyDigits = (s: string) => s.replace(/\D/g, '');

// Uma célula do canvas bento: painel dentro de card com altura limitada e
// botão "Expandir" que abre o mesmo painel em modal.
type PanelDef = {
  key: string;
  anchorId?: string;
  span: 2 | 3 | 6;
  title: string;
  node: ReactNode;
  expandable: boolean;
  clamp: boolean;
};

export function Dashboard() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientsQuery = useQuery({
    queryKey: ['patients'],
    queryFn: () => apiGet<PatientsResponse>('/patients'),
    enabled: !!meQuery.data?.user.doctor,
  });

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastCredentials, setLastCredentials] = useState<{ login: string; password: string; name: string } | null>(null);
  const [selected, setSelected] = useState<PatientListItem | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Esc fecha modais (expansão e cadastro)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setExpanded(null);
        setRegisterOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Função utilitária de deep-link: ao clicar em uma notificação, rola até o
  // painel correspondente e/ou seleciona o paciente certo.
  function handleNotifClick(n: { id: string; type: string; relatedDemandId: string | null; readAt: string | null }) {
    if (!n.readAt) {
      apiPost(`/notifications/${n.id}/read`, {}).then(() => notifsQuery.refetch()).catch(() => {});
    }
    setShowNotifs(false);
    setExpanded(null);

    // Tipos possíveis (NOTIFICATION_TYPES): new_demand, demand_response,
    // new_recipe_request, recipe_response, new_document, new_chat_message,
    // appointment_confirmed, etc.
    const type = n.type;
    if (type === 'new_recipe_request' || type === 'recipe_response') {
      // Rolagem suave até o card de receitas
      scrollToPanel('receitas-pendentes');
    } else if (type === 'new_demand' || type === 'demand_response' || type === 'appointment_confirmed') {
      scrollToPanel('demandas');
    } else if (type === 'new_document') {
      // Tenta selecionar o paciente da demanda (se houver) e rolar até Documentos
      if (n.relatedDemandId) {
        selectPatientFromDemand(n.relatedDemandId).then(() => scrollToPanel('documentos'));
      } else {
        scrollToPanel('documentos');
      }
    } else if (type === 'new_chat_message') {
      // relatedDemandId está sendo usado como patientId pelo chat (workaround conhecido).
      const pid = n.relatedDemandId;
      if (pid) {
        const p = patientsQuery.data?.patients.find((x) => x.id === pid);
        if (p) setSelected(p);
      }
      scrollToPanel('conversa');
    } else {
      // Padrão: abrir a lista de demandas
      scrollToPanel('demandas');
    }
  }

  async function selectPatientFromDemand(demandId: string): Promise<void> {
    try {
      const res = await apiGet<{ demand: { patientId: string } }>(`/demands/${demandId}`);
      const pid = res.demand?.patientId;
      if (pid) {
        const p = patientsQuery.data?.patients.find((x) => x.id === pid);
        if (p) setSelected(p);
      }
    } catch {
      /* ignore */
    }
  }

  function scrollToPanel(id: string) {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  const notifsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<NotificationsResponse>('/notifications'),
    refetchInterval: 30000,
  });

  const addPatient = useMutation({
    mutationFn: () =>
      apiPost<{ ok: boolean; credentials: { login: string; password: string } }>('/patients', {
        fullName,
        cpf: onlyDigits(cpf),
        phone: onlyDigits(phone),
        email: email.trim() ? email.trim() : undefined,
        dateOfBirth,
        medicalHistory: medicalHistory.trim() || undefined,
        allergies: allergies.trim() || undefined,
      }),
    onSuccess: (data) => {
      setLastCredentials({ login: data.credentials.login, password: data.credentials.password, name: fullName });
      setFullName('');
      setCpf('');
      setPhone('');
      setEmail('');
      setDateOfBirth('');
      setMedicalHistory('');
      setAllergies('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : 'Erro ao cadastrar.'),
  });

  const me = meQuery.data?.user;
  const doctor = me?.doctor;

  const placeholder = (title: string) => (
    <section className="card">
      <h2>{title}</h2>
      <p className="muted">Selecione um paciente em foco para ver.</p>
    </section>
  );

  const patientsCard = (
    <section className="card">
      <h2>
        Meus pacientes{' '}
        {patientsQuery.data && <span className="badge">{patientsQuery.data.patients.length}</span>}
      </h2>
      {patientsQuery.isLoading && <p className="muted">Carregando…</p>}
      {patientsQuery.data && patientsQuery.data.patients.length === 0 && (
        <p className="muted">Nenhum paciente cadastrado ainda.</p>
      )}
      <ul className="patient-list">
        {patientsQuery.data?.patients.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={selected?.id === p.id ? 'patient-item patient-item--selected' : 'patient-item'}
              onClick={() => setSelected(p)}
            >
              <div>
                <strong>{p.user.fullName}</strong>
                <div className="muted small">
                  CPF {p.user.cpf} · {p.user.phone}
                </div>
              </div>
              <span className={`tag tag--${p.status}`}>{p.status}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  const panelDefs: PanelDef[] = [
    { key: 'demandas', anchorId: 'demandas', span: 3, title: 'Demandas', node: <DemandsPanel />, expandable: true, clamp: true },
    { key: 'pacientes', span: 3, title: 'Meus pacientes', node: patientsCard, expandable: true, clamp: true },
    {
      key: 'conversa',
      anchorId: 'conversa',
      span: 3,
      title: selected ? `Conversa · ${selected.user.fullName}` : 'Conversa',
      node: selected ? (
        <ChatPanel patientId={selected.id} patientName={selected.user.fullName} />
      ) : (
        placeholder('Conversa')
      ),
      expandable: !!selected,
      clamp: false,
    },
    {
      key: 'receitas',
      anchorId: 'receitas-pendentes',
      span: 3,
      title: 'Receitas',
      node: <RecipesPanel patientId={selected?.id ?? null} patientName={selected?.user.fullName} role="doctor" />,
      expandable: true,
      clamp: true,
    },
    {
      key: 'exames',
      anchorId: 'solicitacoes-exame',
      span: 2,
      title: 'Exames',
      node: selected ? (
        <ExamsPanel patientId={selected.id} patientName={selected.user.fullName} />
      ) : (
        placeholder('Exames')
      ),
      expandable: !!selected,
      clamp: true,
    },
    {
      key: 'documentos',
      anchorId: 'documentos',
      span: 2,
      title: 'Documentos',
      node: selected ? (
        <DocumentsPanel patientId={selected.id} patientName={selected.user.fullName} />
      ) : (
        placeholder('Documentos')
      ),
      expandable: !!selected,
      clamp: true,
    },
    { key: 'assistentes', span: 2, title: 'Assistentes', node: <AssistantsPanel />, expandable: true, clamp: true },
    ...(selected
      ? ([
          {
            key: 'cefaleia',
            span: 3,
            title: `Diário de cefaleia · ${selected.user.fullName}`,
            node: <HeadachePanel patientId={selected.id} patientName={selected.user.fullName} />,
            expandable: true,
            clamp: true,
          },
          {
            key: 'convulsao',
            span: 3,
            title: `Diário de convulsão · ${selected.user.fullName}`,
            node: <SeizurePanel patientId={selected.id} patientName={selected.user.fullName} />,
            expandable: true,
            clamp: true,
          },
          {
            key: 'eventos',
            span: 6,
            title: `Eventos clínicos · ${selected.user.fullName}`,
            node: <HealthEventPanel patientId={selected.id} patientName={selected.user.fullName} />,
            expandable: true,
            clamp: true,
          },
        ] as PanelDef[])
      : []),
  ];

  const expandedDef = expanded ? panelDefs.find((d) => d.key === expanded) ?? null : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>MEDconecta</h1>
          <span className="subtitle">
            {me ? `${me.fullName}${doctor ? ` · ${doctor.specialization}` : ''}` : 'Carregando…'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
          <button
            className="btn-ghost btn-notif"
            onClick={() => setShowNotifs((v) => !v)}
            aria-label={
              notifsQuery.data?.unreadCount
                ? `${notifsQuery.data.unreadCount} notificações não lidas`
                : 'Notificações'
            }
          >
            <span className="notif-bell" aria-hidden="true" />
            {notifsQuery.data?.unreadCount ? (
              <span className="notif-count">{notifsQuery.data.unreadCount}</span>
            ) : null}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <strong>Notificações</strong>
                <button
                  className="notif-close"
                  onClick={() => {
                    apiPost('/notifications/read-all', {}).then(() =>
                      notifsQuery.refetch(),
                    );
                    setShowNotifs(false);
                  }}
                >
                  Marcar todas lidas
                </button>
              </div>
              {notifsQuery.data?.notifications.length === 0 && (
                <p className="muted" style={{ padding: '12px 16px', margin: 0 }}>Sem notificações.</p>
              )}
              {notifsQuery.data?.notifications.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={
                    n.readAt
                      ? 'notif-item notif-item--read notif-item--clickable'
                      : 'notif-item notif-item--clickable'
                  }
                  onClick={() => handleNotifClick(n)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid rgba(15,59,65,0.06)',
                    padding: '10px 16px',
                  }}
                >
                  <strong>{n.title}</strong>
                  <div className="muted small">{n.body}</div>
                </button>
              ))}
            </div>
          )}
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="notice">{ELECTIVE_SCOPE_NOTICE.short}</div>

        {meQuery.isLoading && <p className="muted">Carregando perfil…</p>}

        {me && !doctor && (
          <section className="card">
            <h2>Conta sem perfil de médico</h2>
            <p className="muted">
              Sua conta está autenticada, mas não possui um perfil de médico associado.
            </p>
          </section>
        )}

        {doctor && (
          <>
            <div className="bento-toolbar">
              <span className="toolbar-label">Paciente em foco:</span>
              <select
                value={selected?.id ?? ''}
                onChange={(e) => {
                  const p = patientsQuery.data?.patients.find((x) => x.id === e.target.value) ?? null;
                  setSelected(p);
                }}
                aria-label="Paciente em foco"
              >
                <option value="">— nenhum —</option>
                {patientsQuery.data?.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.fullName}
                  </option>
                ))}
              </select>
              <span className="toolbar-spacer" />
              <button className="btn-primary" type="button" onClick={() => setRegisterOpen(true)}>
                + Cadastrar paciente
              </button>
            </div>

            <div className="bento">
              {panelDefs.map((d) => {
                const isOpen = expanded === d.key;
                return (
                  <div
                    key={d.key}
                    id={d.anchorId}
                    className={`bento-cell bc-${d.span}${d.clamp && !isOpen ? ' bento-cell--clamped' : ''}`}
                  >
                    {isOpen ? (
                      <section className="card bento-ghost">Aberto em destaque…</section>
                    ) : (
                      <>
                        {d.node}
                        {d.expandable && (
                          <button
                            type="button"
                            className="bento-expand"
                            onClick={() => setExpanded(d.key)}
                            aria-label={`Expandir ${d.title}`}
                          >
                            Expandir ⤢
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {expandedDef && (
        <div className="modal-overlay" onClick={() => setExpanded(null)}>
          <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>{expandedDef.title}</strong>
              <button className="btn-ghost small" type="button" onClick={() => setExpanded(null)}>
                Fechar ✕
              </button>
            </div>
            <div className="modal-body">{expandedDef.node}</div>
          </div>
        </div>
      )}

      {registerOpen && (
        <div className="modal-overlay" onClick={() => setRegisterOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Cadastrar paciente</strong>
              <button className="btn-ghost small" type="button" onClick={() => setRegisterOpen(false)}>
                Fechar ✕
              </button>
            </div>
            <div className="modal-body">
              {lastCredentials && (
                <div className="credentials-box">
                  <strong>{lastCredentials.name} cadastrado</strong>
                  <p>Informe ao paciente as credenciais de acesso ao app:</p>
                  <div className="credentials-row">
                    <span className="cred-label">CPF (login):</span>
                    <code>{lastCredentials.login}</code>
                  </div>
                  <div className="credentials-row">
                    <span className="cred-label">Senha (nasc.):</span>
                    <code>{lastCredentials.password}</code>
                  </div>
                  <p className="muted small">Formato da senha: DDMMAAAA · Ex: 22111989 = 22/11/1989</p>
                  <button className="btn-ghost small" onClick={() => setLastCredentials(null)}>
                    Fechar
                  </button>
                </div>
              )}

              <form
                className="patient-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setLastCredentials(null);
                  addPatient.mutate();
                }}
              >
                <label>
                  Nome completo
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </label>
                <div className="row">
                  <label>
                    CPF
                    <input
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      required
                    />
                  </label>
                  <label>
                    Telefone
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="55 83 99999-0000"
                      required
                    />
                  </label>
                </div>
                <div className="row">
                  <label>
                    Data de nascimento
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      title="Vira a senha inicial do paciente (DDMMAAAA)"
                    />
                  </label>
                  <label>
                    E-mail (opcional)
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="paciente@exemplo.com"
                    />
                  </label>
                </div>
                <label>
                  Histórico médico (opcional)
                  <textarea
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Diagnósticos anteriores, cirurgias…"
                    rows={2}
                  />
                </label>
                <label>
                  Alergias (opcional)
                  <input
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="AAS, penicilina…"
                  />
                </label>
                {formError && <div className="auth-error">{formError}</div>}
                <button className="btn-primary" type="submit" disabled={addPatient.isPending}>
                  {addPatient.isPending ? 'Salvando…' : 'Cadastrar paciente'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
