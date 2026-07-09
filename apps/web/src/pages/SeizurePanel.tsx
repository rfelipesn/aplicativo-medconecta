import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { SeizureResponse, SeizureStatsResponse } from '../types';

interface SeizurePanelProps {
  patientId: string;
  patientName: string;
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes === 0) return 'N/A';
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

function BoolBadge({ value, yesLabel = 'Sim', noLabel = 'Não' }: { value: boolean; yesLabel?: string; noLabel?: string }) {
  return (
    <span style={{ color: value ? '#10b981' : '#ef4444', fontWeight: 500 }}>
      {value ? yesLabel : noLabel}
    </span>
  );
}

export function SeizurePanel({ patientId, patientName }: SeizurePanelProps) {
  const entriesQuery = useQuery({
    queryKey: ['seizure-diary', patientId],
    queryFn: () => apiGet<SeizureResponse>(`/patients/${patientId}/seizure-diary`),
  });

  const statsQuery = useQuery({
    queryKey: ['seizure-diary-stats', patientId],
    queryFn: () => apiGet<SeizureStatsResponse>(`/patients/${patientId}/seizure-diary/stats?days=30`),
  });

  const isLoading = entriesQuery.isLoading || statsQuery.isLoading;
  const entries = entriesQuery.data?.entries ?? [];
  const stats = statsQuery.data?.stats;

  const topHospital = stats?.hospital.mostCited[0];
  const topBrand = stats?.brandChange.topBrands[0];

  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  let weekdayWithMostCrises = '';
  if (stats && stats.weekday.some((c) => c > 0)) {
    const maxCount = Math.max(...stats.weekday);
    const maxIdx = stats.weekday.indexOf(maxCount);
    weekdayWithMostCrises = weekdayNames[maxIdx] ?? '';
  }

  return (
    <section className="card">
      <h2>
        Diário de Convulsão — {patientName}
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
                <strong>{stats.totals.daysWithSeizure}</strong> dias com crise
              </div>
              <div className="muted small">
                <strong>{stats.frequencyPerWeek}</strong> crises/semana
              </div>
              <div className="muted small">
                Perda de consciência: <strong>{stats.consciousness.percentWithLoss}%</strong>
              </div>
              <div className="muted small">
                Visita hospitalar: <strong>{stats.hospital.percentVisited}%</strong>
              </div>
              <div className="muted small">
                Duração média: <strong>{formatDuration(stats.duration.avgMinutes)}</strong>
              </div>
              {stats.duration.longestMinutes && (
                <div className="muted small">
                  Maior: <strong>{formatDuration(stats.duration.longestMinutes)}</strong>
                  {stats.duration.longestDate && ` (${formatDate(stats.duration.longestDate)})`}
                </div>
              )}
              {stats.duration.shortestMinutes && (
                <div className="muted small">
                  Menor: <strong>{formatDuration(stats.duration.shortestMinutes)}</strong>
                  {stats.duration.shortestDate && ` (${formatDate(stats.duration.shortestDate)})`}
                </div>
              )}
              <div className="muted small">
                Med. tomada corretamente: <strong>{stats.medication.percentCorrect}%</strong>
              </div>
              {topBrand && (
                <div className="muted small">
                  Marca mais citada: <strong>{topBrand.name}</strong> ({topBrand.count}x)
                </div>
              )}
              {topHospital && (
                <div className="muted small">
                  Hospital mais citado: <strong>{topHospital.name}</strong> ({topHospital.count}x)
                </div>
              )}
              {weekdayWithMostCrises && (
                <div className="muted small">
                  Dia com mais crises: <strong>{weekdayWithMostCrises}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && !isLoading && (
        <p className="muted">Nenhum registro de convulsão ainda.</p>
      )}

      <ul className="patient-list">
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.id} className="patient-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{formatDate(entry.seizureDate)}{entry.seizureTime && ` às ${entry.seizureTime}`}</strong>
              <span style={{ color: entry.lossOfConsciousness ? '#ef4444' : '#10b981', fontWeight: 600, fontSize: '0.85em' }}>
                {entry.lossOfConsciousness ? 'Perda de consciência' : 'Sem perda de consciência'}
              </span>
            </div>
            <div className="muted small">
              Duração: {formatDuration(entry.durationMinutes)}
            </div>
            <div className="muted small">
              Hospital: <BoolBadge value={entry.hospitalVisit} />
              {entry.hospitalVisit && entry.hospitalName && ` — ${entry.hospitalName}`}
            </div>
            <div className="muted small">
              Medicação corretamente: <BoolBadge value={entry.medicationTakenCorrectly} />
            </div>
            {entry.medicationBrandChanged && entry.newMedicationBrand && (
              <div className="muted small">
                Mudança de marca: <strong>{entry.newMedicationBrand}</strong>
              </div>
            )}
            {entry.additionalNotes && (
              <div className="muted small" style={{ marginTop: 4, fontStyle: 'italic' }}>
                {entry.additionalNotes}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
