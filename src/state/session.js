import { createStore } from './createStore.js';
import { getSession, onAuthStateChange } from '../auth/auth.js';

const store = createStore({ session: null, loading: true });

export const useSession = store.useStore;
export const getSessionState = store.getState;

export async function initSession() {
  const session = await getSession();
  store.setState({ session, loading: false });

  onAuthStateChange((session) => {
    store.setState({ session, loading: false });
  });
}
