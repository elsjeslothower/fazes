import { useRoute, navigate } from '../router.js';

const TABS = [
  { path: '/dashboard', label: 'Today', icon: '🏠' },
  { path: '/log', label: 'Log', icon: '📅' },
  { path: '/guide', label: 'Guide', icon: '📖' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function NavBar() {
  const route = useRoute();

  return (
    <nav class="nav-bar">
      {TABS.map((tab) => (
        <button
          key={tab.path}
          class={`nav-tab ${route === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span class="nav-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
