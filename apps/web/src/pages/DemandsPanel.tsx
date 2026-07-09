import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../lib/api';
import type { DemandsResponse, Demand } from '../types';

const DEMAND_TYPE_LABELS: Record<string, string> = {
  recipe_renewal: 'Renovação de Receita',
  appointment_request: 'Solicitação de Agendamento',
  exam_result: 'Resultado de Exame',
  symptom_log: 'Relato de Sintoma',
  general_question: 'Pergunta Geral',
  second_opinion: 'Segunda Opinião',
};

const DEMAND_STATUS_LABELS: Record<string, string> = {
  open: 'Aberta',
  responded: 'Respondida',
  closed: 'Fechada',
  pending_action: 'Ação Pendente',
};

const DEMAND_PRIORITY_COLORS: Record<string, string> = {
  urgent: '#dc2626', // vermelho
  elective: '#2563eb', // azul
  informational: '#059669', // verde
  other: '#6b7280', // cinza
};

const DEMAND_STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b', // amarelo
  responded: '#10b981', // verde
  closed: '#6b7280', // cinza
  pending_action: '#8b5cf6', // roxo
};

interface DemandsPanelProps {
  patientId?: string | null;
}

export function DemandsPanel({ patientId }: DemandsPanelProps) {
  const queryClient = useQueryClient();
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');

  const demandsQuery = useQuery({
    queryKey: ['demands', patientId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      
      const response = await apiGet<DemandsResponse>(`/demands?${params.toString()}`);
      return response;
    },
  });

  const respondDemand = useMutation({
    mutationFn: async (data: { demandId: string; notes: string; status: 'responded' | 'closed' | 'pending_action' }) => {
      await apiPatch(`/demands/${data.demandId}/respond`, {
        status: data.status,
        responseNotes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      setSelectedDemand(null);
      setResponseNotes('');
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

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>📋 Demandas</h2>
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
                        <div className="demand-response-actions">
                          <button
                            className="btn-primary"
                            onClick={() =>
                              respondDemand.mutate({
                                demandId: demand.id,
                                notes: responseNotes,
                                status: 'responded',
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
