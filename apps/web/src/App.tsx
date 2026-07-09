import { useSession } from './hooks/useSession';
import { AuthScreen } from './pages/AuthScreen';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="splash">
        <span>Carregando…</span>
      </div>
    );
  }

  return session ? <Dashboard /> : <AuthScreen />;
}
