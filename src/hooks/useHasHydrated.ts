import { useEffect, useState } from 'react';

/**
 * Custom hook to safely determine if the component has hydrated on the client.
 * Essential for components reading from persisted Zustand store (localStorage).
 */
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
