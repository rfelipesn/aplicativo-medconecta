import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../lib/api';
import type {
  HealthEvent,
  HealthEventsResponse,
  HealthEventStatsResponse,
  CreateHealthEventInput,
} from '../types';

interface HealthEventPanelProps {
  patientId: string;
  patientName: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  headache: 'Cefaleia',
  seizure: 'Convulsão',
  sleep: 'Sono',
  symptom: 'Sintoma',
  other: 'Outro',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  headache: '#4E8E99',
  seizure: '#9D7BFF',
  sleep: '#6B7F84',
  symptom: '#FF9F45',
  other: '#85B7BF',
};

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function toLocalDatetimeInput(date: Date): string {
  const tz = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HealthEventPanel({ patientId, patientName }: HealthEventPanelProps) {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState<CreateHealthEventInput['eventType']>('symptom');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(() => toLocalDatetimeInput(new Date()));
  const [whenMode, setWhenMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [formError, setFormError] = useState<string | null>(null);

  function applyWhen(mode: 'today' | 'yesterday' | 'custom') {
    setWhenMode(mode);
    if (mode === 'today') {
      setEventDate(toLocalDatetimeInput(new Date()));
    } else if (mode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setEventDate(toLocalDatetimeInput(d));
    }
  }

  const eventsQuery = useQuery({
    queryKey: ['health-events', patientId],
    queryFn: () => apiGet<HealthEventsResponse>(`/patients/${patientId}/health-events?days=30`),
  });

  const statsQuery = useQuery({
    queryKey: ['health-events-stats', patientId],
    queryFn: () => apiGet<HealthEventStatsResponse>(`/patients/${patientId}/health-events/stats?days=30`),
  });

  const createEvent = useMutation({
    mutationFn: (input: CreateHealthEventInput) =>
      apiPost<{ ok: boolean; event: HealthEvent }>(
        `/patients/${patientId}/health-events`,
        input,
      ),
    onSuccess: () => {
      setDescription('');
      setShowForm(false);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['health-events', patientId] });
      queryClient.invalidateQueries({ queryKey: ['health-events-stats', patientId] });
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Erro ao registrar evento.'),
  });

  const events = eventsQuery.data?.events ?? [];
  const stats = statsQuery.data?.stats;
  const isLoading = eventsQuery.isLoading || statsQuery.isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!description.trim()) {
      setFormError('A descrição não pode estar vazia.');
      return;
    }
    createEvent.mutate({
      eventType,
      inputType: 'text',
      descriptionText: description.trim(),
      eventDatetime: new Date(eventDate).toISOString(),
    });
  }

  return (
    <section className="card">
      <h2>
        Anotações de Sintomas — {patientName}
        {eventsQuery.data && <span className="badge">{events.length}</span>}
        <button
          className="btn-ghost small"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowForm((v) => !v)}
          type="button"
        >
          {showForm ? 'Cancelar' : '+ Nova anotação'}
        </button>
      </h2>

      {isLoading && <p className="muted">Carregando…</p>}

      {stats && (
        <div className="patient-list" style={{ marginBottom: 16 }}>
          <div className="patient-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <strong style={{ marginBottom: 4 }}>Últimos 30 dias</strong>
            <div className="row">
              <div className="muted small">
                <strong>{stats.totals.count}</strong> anotações
              </div>
              <div className="muted small">
                <strong>{stats.totals.distinctDays}</strong> dias distintos
              </div>
              <div className="muted small">
                <strong>{stats.totals.averagePerWeek}</strong> por semana
              </div>
            </div>
            {stats.byType.length > 0 && (
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {stats.byType.map((t) => (
                  <span
                    key={t.type}
                    className="tag"
                    style={{
                      backgroundColor: '#E8F2F3',
                      color: EVENT_TYPE_COLORS[t.type] ?? '#333',
                    }}
                  >
                    {EVENT_TYPE_LABELS[t.type] ?? t.type}: {t.count} ({t.percent}%)
                  </span>
                ))}
              </div>
            )}
            {stats.weekday.some((c) => c > 0) && (
              <div className="muted small" style={{ marginTop: 4 }}>
                Pico semanal: <strong>
                  {WEEKDAY_NAMES[stats.weekday.indexOf(Math.max(...stats.weekday))]}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <form
          className="patient-form"
          style={{ marginBottom: 16, padding: 12, background: '#F0F6F7', borderRadius: 14 }}
          onSubmit={handleSubmit}
        >
          <div className="row">
            <label>
              Tipo
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CreateHealthEventInput['eventType'])}
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Quando
              <div className="filter-group" style={{ gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={whenMode === 'today' ? 'btn-primary small' : 'btn-ghost small'}
                  onClick={() => applyWhen('today')}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  className={whenMode === 'yesterday' ? 'btn-primary small' : 'btn-ghost small'}
                  onClick={() => applyWhen('yesterday')}
                >
                  Ontem
                </button>
                <button
                  type="button"
                  className={whenMode === 'custom' ? 'btn-primary small' : 'btn-ghost small'}
                  onClick={() => applyWhen('custom')}
                >
                  Escolher data
                </button>
              </div>
              {whenMode === 'custom' && (
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  style={{ marginTop: 6, width: '100%' }}
                />
              )}
              {whenMode !== 'custom' && (
                <div className="muted small" style={{ marginTop: 4 }}>
                  {formatDateTime(new Date(eventDate).toISOString())}
                </div>
              )}
            </label>
          </div>
          <label>
            Descrição
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              maxLength={2000}
              placeholder="Ex: Dor de cabeça leve, lado direito, durou 2h…"
            />
          </label>
          {formError && <div className="auth-error">{formError}</div>}
          <button className="btn-primary" type="submit" disabled={createEvent.isPending}>
            {createEvent.isPending ? 'Salvando…' : 'Salvar anotação'}
          </button>
        </form>
      )}

      {events.length === 0 && !isLoading && (
        <p className="muted">Nenhuma anotação de sintoma registrada nos últimos 30 dias.</p>
      )}

      <ul className="patient-list">
        {events.slice(0, 5).map((event) => (
          <li
            key={event.id}
            className="patient-item"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <strong>{formatDateTime(event.eventDatetime)}</strong>
              <span
                className="tag"
                style={{
                  backgroundColor: '#E8F2F3',
                  color: EVENT_TYPE_COLORS[event.eventType] ?? '#333',
                }}
              >
                {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              </span>
            </div>
            {event.descriptionText && (
              <div className="muted small" style={{ fontStyle: 'italic' }}>
                {event.descriptionText}
              </div>
            )}
            {event.inputType === 'audio' && event.audioUrl && (
              <audio controls src={event.audioUrl} style={{ width: '100%' }} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
