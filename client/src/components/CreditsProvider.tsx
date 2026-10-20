'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get } from '@/lib/api';

interface CreditsContextValue {
  credits: number | null;
  username: string | null;
  setCredits: (credits: number) => void;
  refresh: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCreditsState] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const setCredits = useCallback((next: number) => setCreditsState(next), []);

  const refresh = useCallback(async () => {
    try {
      const data = await get<{ user: { username: string; credits: number } }>('/auth/me');
      setCreditsState(data.user.credits);
      setUsername(data.user.username);
    } catch {
      // Signed-out visitors hit protected pages only through the middleware
      // redirect, so a 401 here is expected and should stay quiet.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ credits, username, setCredits, refresh }),
    [credits, username, setCredits, refresh],
  );

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used inside CreditsProvider');
  return context;
}
