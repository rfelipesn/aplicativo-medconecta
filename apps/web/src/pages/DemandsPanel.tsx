import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import type { DemandsResponse, Demand } from '../types';

const DEMAND_TYPE_LABELS: Record<string, string> = {
  recipe_renewal: 'Renovação de Receita',
  appointment_request: 'Solicitação de Agendamento',
  general_question: 'Pergunta Geral',
  second_opinion: 'Segunda Opinião',
};

const DEMAND_STATUS_LABELS: Record<string, string> = {
  open: 'Aberta',
  responded: 'Respondida',
  closed: 'Fechada',
  pending_action: 'Ação Pendente',
};

/** Fluent Accent priority / status colors */
const DEMAND_PRIORITY_COLORS: Record<string, string> = {
  urgent: '#FF5D5D',
  elective: '#FF9F45',
  informational: '#4E9EF5',
  other: '#9D7BFF',
};

const DEMAND_STATUS_COLORS: Record<string, string> = {
  open: '#FF9F45',
  responded: '#34C98E',
  closed: '#6B7F84',
  pending_action: '#9D7BFF',
};

function waitLabel(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return 'agora';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

interface DemandsPanelProps {
  patientId?: string | null;
}

export function DemandsPanel({ patientId }: DemandsPanelProps) {
  const queryClient = useQueryClient();
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLocation, setApptLocation] = useState('');
  const [apptError, setApptError] = useState<string | null>(null);

  const demandsQuery = useQuery({
    queryKey: ['demands', patientId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      
      const response = await apiGet<DemandsResponse>(`/demands?${params.toString()}`);
      return response;
    },
    // Paciente cria demanda em outra sessão; médico precisa ver sem F5.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const respondDemand = useMutation({
    mutationFn: async (data: { demandId: string; notes: string; status: 'responded' | 'closed' | 'pending_action'; demand?: Demand }) => {
      // Se for demanda de receita e houver arquivo anexo, faz upload do documento
      // no Storage e registra no banco antes de marcar a demanda como respondida.
      if (data.demand && attachFile && data.demand.type === 'recipe_renewal') {
        const pid = data.demand.patient?.id;
        if (pid) {
          try {
            setAttachError(null);
            const signed = await apiPost<{ signedUrl: string; storagePath: string }>(
              `/patients/${pid}/documents/sign-upload`,
              {
                filename: attachFile.name,
                mimeType: attachFile.type || 'application/octet-stream',
                documentType: 'recipe',
              },
            );
            const putRes = await fetch(signed.signedUrl, {
              method: 'PUT',
              headers: { 'Content-Type': attachFile.type || 'application/octet-stream' },
              body: attachFile,
            });
            if (!putRes.ok) throw new Error(`Upload falhou (${putRes.status})`);
            await apiPost(`/patients/${pid}/documents`, {
              storagePath: signed.storagePath,
              documentType: 'recipe',
              fileName: attachFile.name,
              fileSize: attachFile.size,
              mimeType: attachFile.type || 'application/octet-stream',
            });
          } catch (err) {
            setAttachError(err instanceof Error ? err.message : 'Falha no anexo.');
            throw err;
          }
        }
      }
      await apiPatch(`/demands/${data.demandId}/respond`, {
        status: data.status,
        responseNotes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDemand(null);
      setResponseNotes('');
      setAttachFile(null);
      setAttachError(null);
      if (attachRef.current) attachRef.current.value = '';
    },
  });

  const closeDemand = useMutation({
    mutationFn: async (demandId: string) => {
      await apiPatch(`/demands/${demandId}/status`, { status: 'closed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      setSelectedDemand(null);
      setResponseNotes('');
    },
  });

  const confirmAppointment = useMutation({
    mutationFn: async (data: { demandId: string; date: string; time: string; location: string }) => {
      await apiPatch(`/demands/${data.demandId}/confirm-appointment`, {
        date: data.date,
        time: data.time,
        location: data.location,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      setSelectedDemand(null);
      setApptDate('');
      setApptTime('');
      setApptLocation('');
      setApptError(null);
    },
    onError: (err) => {
      setApptError(err instanceof Error ? err.message : 'Erro ao confirmar consulta.');
    },
  });

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Demandas</h2>
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="open">Abertas</option>
            <option value="responded">Respondidas</option>
            <option value="closed">Fechadas</option>
            <option value="pending_action">Ação Pendente</option>
          </select>
        </div>
      </header>

      {demandsQuery.isLoading && <p className="loading">Carregando demandas...</p>}
      {demandsQuery.isError && <p className="error">Erro ao carregar demandas.</p>}

      {demandsQuery.data && demandsQuery.data.demands.length === 0 && (
        <p className="empty">Nenhuma demanda encontrada.</p>
      )}

      {demandsQuery.data && demandsQuery.data.demands.length > 0 && (
        <ul className="demands-list">
          {demandsQuery.data.demands.map((demand) => {
            const isSelected = selectedDemand?.id === demand.id;
            return (
              <li key={demand.id} className={`demand-item ${isSelected ? 'expanded' : ''}`}>
                <div
                  className="demand-item-header"
                  onClick={() => setSelectedDemand(isSelected ? null : demand)}
                >
                  <div className="demand-item-main">
                    <div className="demand-item-title">
                      <span className="demand-type-badge" style={{ backgroundColor: DEMAND_PRIORITY_COLORS[demand.priority || 'other'] }}>
                        {DEMAND_TYPE_LABELS[demand.type] || demand.type}
                      </span>
                      {demand.title && <h3>{demand.title}</h3>}
                    </div>
                    <div className="demand-item-meta">
                      <span className="demand-status" style={{ color: DEMAND_STATUS_COLORS[demand.status] }}>
                        {DEMAND_STATUS_LABELS[demand.status] || demand.status}
                      </span>
                      <span className="demand-priority">
                        Prioridade: <strong>{demand.priority || 'não definida'}</strong>
                      </span>
                      {demand.patient && (
                        <span className="demand-patient">
                          Paciente: {demand.patient.user.fullName}
                        </span>
                      )}
                      <span className="demand-wait" title={new Date(demand.createdAt).toLocaleString('pt-BR')}>
                        Espera: <strong>{waitLabel(demand.createdAt)}</strong>
                      </span>
                      <span className="demand-date">
                        {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  {!isSelected && (
                    <button className="expand-btn" aria-label="Expandir">
                      ▼
                    </button>
                  )}
                </div>

                {isSelected && (
                  <div className="demand-item-details">
                    <div className="demand-description">
                      <h4>Descrição:</h4>
                      <p>{demand.description}</p>
                    </div>

                    {demand.aiConfidenceScore !== null && (
                      <div className="demand-ai-info">
                        <strong>Confiança da IA:</strong> {demand.aiConfidenceScore}%
                      </div>
                    )}

                    {demand.status === 'open' && (
                      <div className="demand-response-form">
                        <h4>Responder à demanda:</h4>
                        <textarea
                          value={responseNotes}
                          onChange={(e) => setResponseNotes(e.target.value)}
                          placeholder="Digite sua resposta..."
                          rows={4}
                        />
                        {demand.type === 'recipe_renewal' && (
                          <div className="demand-attach" style={{ marginTop: 8 }}>
                            <label className="muted small" style={{ display: 'block', marginBottom: 4 }}>
                              Anexar receita (PDF, JPG, PNG) — opcional
                            </label>
                            <input
                              ref={attachRef}
                              type="file"
                              accept="application/pdf,image/jpeg,image/png"
                              onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
                            />
                            {attachError && (
                              <div className="auth-error" style={{ marginTop: 4 }}>{attachError}</div>
                            )}
                          </div>
                        )}
                        <div className="demand-response-actions">
                          <button
                            className="btn-primary"
                            onClick={() =>
                              respondDemand.mutate({
                                demandId: demand.id,
                                notes: responseNotes,
                                status: 'responded',
                                demand,
                              })
                            }
                            disabled={respondDemand.isPending}
                          >
                            {respondDemand.isPending ? 'Enviando...' : 'Marcar como Respondida'}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() =>
                              respondDemand.mutate({
                                demandId: demand.id,
                                notes: responseNotes,
                                status: 'pending_action',
                                demand,
                              })
                            }
                            disabled={respondDemand.isPending}
                          >
                            Marcar Ação Pendente
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => closeDemand.mutate(demand.id)}
                            disabled={closeDemand.isPending}
                          >
                            Fechar Demanda
                          </button>
                        </div>

                        {demand.type === 'appointment_request' && (
                          <div className="demand-attach" style={{ marginTop: 12 }}>
                            <h4 style={{ margin: '0 0 6px' }}>Confirmar consulta</h4>
                            <p className="muted small" style={{ margin: '0 0 8px' }}>
                              Marca a demanda como respondida e envia ao paciente a data/hora/local.
                            </p>
                            <div className="row">
                              <label>
                                Data
                                <input
                                  type="date"
                                  value={apptDate}
                                  onChange={(e) => setApptDate(e.target.value)}
                                />
                              </label>
                              <label>
                                Hora
                                <input
                                  type="time"
                                  value={apptTime}
                                  onChange={(e) => setApptTime(e.target.value)}
                                />
                              </label>
                            </div>
                            <label style={{ display: 'block', marginTop: 6 }}>
                              Local
                              <input
                                type="text"
                                value={apptLocation}
                                onChange={(e) => setApptLocation(e.target.value)}
                                placeholder="Ex: Consultório — Rua X, 123"
                              />
                            </label>
                            {apptError && (
                              <div className="auth-error" style={{ marginTop: 4 }}>{apptError}</div>
                            )}
                            <button
                              className="btn-primary"
                              style={{ marginTop: 8 }}
                              onClick={() =>
                                confirmAppointment.mutate({
                                  demandId: demand.id,
                                  date: apptDate,
                                  time: apptTime,
                                  location: apptLocation,
                                })
                              }
                              disabled={
                                confirmAppointment.isPending ||
                                !apptDate ||
                                !apptTime ||
                                !apptLocation.trim()
                              }
                            >
                              {confirmAppointment.isPending ? 'Confirmando...' : 'Confirmar Consulta'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {demand.status !== 'open' && (
                      <div className="demand-status-info">
                        {demand.respondedAt && (
                          <p>
                            <strong>Respondida em:</strong>{' '}
                            {new Date(demand.respondedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {demand.closedAt && (
                          <p>
                            <strong>Fechada em:</strong>{' '}
                            {new Date(demand.closedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}

                    <button className="collapse-btn" onClick={() => setSelectedDemand(null)}>
                      Recolher ▲
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
