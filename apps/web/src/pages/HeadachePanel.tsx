import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { HeadacheResponse, HeadacheStatsResponse } from '../types';

interface HeadachePanelProps {
  patientId: string;
  patientName: string;
}

function getSeverityColor(label: string): string {
  if (label === 'Leve' || label === 'leve') return '#34C98E';
  if (label === 'Moderado' || label === 'moderado') return '#FF9F45';
  if (label === 'Severo' || label === 'severo') return '#FF5D5D';
  return '#6B7F84';
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function HeadachePanel({ patientId, patientName }: HeadachePanelProps) {
  const entriesQuery = useQuery({
    queryKey: ['headache-diary', patientId],
    queryFn: () => apiGet<HeadacheResponse>(`/patients/${patientId}/headache-diary`),
  });

  const statsQuery = useQuery({
    queryKey: ['headache-diary-stats', patientId],
    queryFn: () => apiGet<HeadacheStatsResponse>(`/patients/${patientId}/headache-diary/stats?days=30`),
  });

  const isLoading = entriesQuery.isLoading || statsQuery.isLoading;
  const entries = entriesQuery.data?.entries ?? [];
  const stats = statsQuery.data?.stats;

  const topTrigger = stats?.triggers[0];

  return (
    <section className="card">
      <h2>
        Diário de Cefaleia — {patientName}
        {entriesQuery.data && <span className="badge">{entries.length}</span>}
      </h2>

      {isLoading && <p className="muted">Carregando…</p>}

      {stats && (
        <div className="patient-list" style={{ marginBottom: 16 }}>
          <div className="patient-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <strong style={{ marginBottom: 4 }}>Últimos 30 dias</strong>
            <div className="row">
              <div className="muted small">
                <strong>{stats.totals.count}</strong> crises
              </div>
              <div className="muted small">
                <strong>{stats.totals.daysWithHeadache}/{stats.range.days}</strong> dias com dor
              </div>
              <div className="muted small">
                <strong>{stats.frequencyPerWeek}</strong> crises/semana
              </div>
              <div className="muted small">
                Severidade: <strong style={{ color: getSeverityColor(stats.severity.predominant ?? '') }}>
                  {stats.severity.predominant ? stats.severity.predominant.charAt(0).toUpperCase() + stats.severity.predominant.slice(1) : 'N/A'}
                </strong>
              </div>
              <div className="muted small">
                Duração média: <strong>{formatDuration(stats.duration.avgMinutes)}</strong>
              </div>
              {topTrigger && (
                <div className="muted small">
                  Maior gatilho: <strong>{topTrigger.name}</strong> ({topTrigger.count}x)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && !isLoading && (
        <p className="muted">Nenhum registro de cefaleia ainda.</p>
      )}

      <ul className="patient-list">
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.id} className="patient-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{formatDate(entry.diaryDate)}</strong>
              <span style={{ color: getSeverityColor(entry.intensityLabel), fontWeight: 600 }}>
                {entry.intensityLabel}
              </span>
            </div>
            {entry.types.length > 0 && (
              <div className="muted small">
                Tipos: {entry.types.join(', ')}
              </div>
            )}
            <div className="muted small">
              Duração: {formatDuration(entry.durationMinutes)}
            </div>
            {entry.location && (
              <div className="muted small">
                Localização: {Object.entries(entry.location)
                  .flatMap(([area, regions]) => 
                    Array.isArray(regions) ? regions.map(r => `${r} (${area})`) : []
                  )
                  .join(', ')}
              </div>
            )}
            {entry.medications.length > 0 && (
              <div className="muted small">
                Medicamentos: {entry.medications.join(', ')}
              </div>
            )}
            {entry.notes && (
              <div className="muted small" style={{ marginTop: 4, fontStyle: 'italic' }}>
                {entry.notes}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
