import { useEffect, useState } from 'preact/hooks';

// A minimal external store (state + subscribe + a hook to read it reactively)
// — deliberately hand-rolled rather than pulling in @preact/signals, since
// this app's shared state (session, cycle data) is small and simple enough
// not to need a dedicated state-management dependency.
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    for (const listener of listeners) listener(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useStore() {
    const [value, setValue] = useState(state);
    useEffect(() => {
      // state can change between the initial render above and this effect
      // attaching (e.g. an async setState resolving in that gap) — re-sync
      // before subscribing so that update isn't silently missed.
      setValue(state);
      return subscribe(setValue);
    }, []);
    return value;
  }

  return { getState, setState, subscribe, useStore };
}
