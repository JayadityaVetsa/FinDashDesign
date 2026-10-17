"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Holding } from "./models";
import { SaveQueue, registerSaveQueue } from "./saveQueue";
import { updateProfile } from "./data";
import { readStorage, writeStorage } from "./storage";
import { errorMessage } from "./errors";
type UserContextType = {
  userId: string; holdings: Holding[]; setHoldings: (value: Holding[]) => void;
  portfolioError: string | null; retryPortfolio: () => void;
};
const UserContext = createContext<UserContextType | null>(null);
export function UserProvider({ userId, initialHoldings, children, localOnly = false }: {
  userId: string; initialHoldings: Holding[]; children: React.ReactNode; localOnly?: boolean;
}) {
  const draftKey = `findash-holdings-draft-${userId}`;
  const [holdings, setState] = useState(() => readStorage<Holding[]>(draftKey, initialHoldings));
  const [portfolioError, setError] = useState<string | null>(null);
  const queue = useMemo(() => new SaveQueue<Holding[]>(async (_id, value) => {
    if (localOnly) return;
    await updateProfile(userId, { portfolio_holdings: value });
    if (JSON.stringify(readStorage(draftKey, null)) === JSON.stringify(value)) {
      try { localStorage.removeItem(draftKey); } catch { /* unavailable */ }
    }
  }, error => setError(errorMessage(error))), [userId, draftKey, localOnly]);
  useEffect(() => {
    const unregister = registerSaveQueue(queue);
    const draft = readStorage<Holding[] | null>(draftKey, null);
    if (draft) queue.schedule(userId, draft);
    const flush = () => { void queue.flushAll(); };
    const warn = (event: BeforeUnloadEvent) => { if (queue.busy) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", warn);
    return () => {
      unregister();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", warn);
      void queue.flushAll();
    };
  }, [draftKey, queue, userId]);
  const setHoldings = (value: Holding[]) => {
    setState(value);
    writeStorage(draftKey, value);
    queue.schedule(userId, value);
  };
  return <UserContext.Provider value={{ userId, holdings, setHoldings, portfolioError,
    retryPortfolio: () => { setError(null); void queue.flushAll(); } }}>{children}</UserContext.Provider>;
}
export function usePortfolio() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("usePortfolio must be used inside a UserProvider.");
  return ctx;
}
