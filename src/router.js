import { useEffect, useState } from 'preact/hooks';

// A small hash-based router — enough for five flat screens with no nested
// routes or params, without pulling in a routing library.
function currentPath() {
  return window.location.hash.slice(1) || '/';
}

export function navigate(path) {
  window.location.hash = path;
}

export function useRoute() {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onHashChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return path;
}
