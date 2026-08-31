import { useEffect } from 'preact/hooks';
import { useSession } from './state/session.js';
import { loadForUser, clearOnSignOut } from './state/cycleStore.js';
import { useRoute, navigate } from './router.js';
import { AuthView } from './views/AuthView.jsx';
import { OnboardingView } from './views/OnboardingView.jsx';
import { DashboardView } from './views/DashboardView.jsx';
import { LogView } from './views/LogView.jsx';
import { PhaseGuideView } from './views/PhaseGuideView.jsx';
import { SettingsView } from './views/SettingsView.jsx';
import { NavBar } from './components/NavBar.jsx';

const ROUTES = {
  '/dashboard': DashboardView,
  '/log': LogView,
  '/guide': PhaseGuideView,
  '/settings': SettingsView,
  '/onboarding': OnboardingView,
};

export function App() {
  const { session, loading: sessionLoading } = useSession();
  const route = useRoute();

  useEffect(() => {
    if (session?.user?.id) {
      loadForUser(session.user.id);
    } else if (!sessionLoading) {
      clearOnSignOut();
    }
  }, [session?.user?.id, sessionLoading]);

  useEffect(() => {
    if (session && !ROUTES[route]) navigate('/dashboard');
  }, [session, route]);

  if (sessionLoading) return <p class="loading">Loading…</p>;
  if (!session) return <AuthView />;

  const View = ROUTES[route];

  return (
    <div class="app-shell">
      <main class="app-main">{View ? <View /> : null}</main>
      {route !== '/onboarding' && <NavBar />}
    </div>
  );
}
