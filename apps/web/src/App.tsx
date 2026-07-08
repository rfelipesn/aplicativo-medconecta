import { DEMAND_PRIORITIES, type DemandPriority } from '@medconecta/shared';

const PRIORITY_LABELS: Record<DemandPriority, string> = {
  urgent: 'Urgente (eletivo)',
  elective: 'Eletiva',
  informational: 'Informativa',
  other: 'Outras',
};

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>MEDconecta</h1>
        <span className="subtitle">Painel do Dr. Helton Bruno · Neurologia</span>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>Demandas por prioridade</h2>
          <p className="muted">
            Esqueleto inicial (Fase 0). A lista real de demandas será carregada do Supabase
            com RLS na Fase 1.
          </p>
          <ul className="priority-list">
            {DEMAND_PRIORITIES.map((p) => (
              <li key={p} className={`priority priority--${p}`}>
                {PRIORITY_LABELS[p]}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
