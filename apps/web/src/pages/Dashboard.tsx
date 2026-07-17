import { useState } from 'react';
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
                <div key={n.id} className={n.readAt ? 'notif-item notif-item--read' : 'notif-item'}>
                  <strong>{n.title}</strong>
                  <div className="muted small">{n.body}</div>
                </div>
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
          <div className="grid">
            <div className="col">
              <section className="card">
                <h2>Cadastrar paciente</h2>

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
              </section>

              <section className="card">
                <h2>
                  Meus pacientes{' '}
                  {patientsQuery.data && (
                    <span className="badge">{patientsQuery.data.patients.length}</span>
                  )}
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
                        className={
                          selected?.id === p.id
                            ? 'patient-item patient-item--selected'
                            : 'patient-item'
                        }
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

              <AssistantsPanel />
            </div>

            <div className="col">
              <DemandsPanel />
              {selected ? (
                <>
                  <ChatPanel patientId={selected.id} patientName={selected.user.fullName} />
                  <RecipesPanel patientId={selected.id} patientName={selected.user.fullName} role="doctor" />
                  <ExamsPanel patientId={selected.id} patientName={selected.user.fullName} />
                  <DocumentsPanel patientId={selected.id} patientName={selected.user.fullName} />
                  <HeadachePanel patientId={selected.id} patientName={selected.user.fullName} />
                  <SeizurePanel patientId={selected.id} patientName={selected.user.fullName} />
                  <HealthEventPanel patientId={selected.id} patientName={selected.user.fullName} />
                </>
              ) : (
                <>
                  <section className="card">
                    <h2>Conversa</h2>
                    <p className="muted">Selecione um paciente à esquerda para abrir o chat.</p>
                  </section>
                  <RecipesPanel patientId={null} role="doctor" />
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
