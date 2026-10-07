import { apiRequest, setRequestUser } from "./httpClient";
import type { Session } from "./models";
import { flushPendingSaves } from "./saveQueue";
export type { Session } from "./models";
type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();
export const auth = {
  async getSession() {
    const session = await apiRequest<Session | null>("auth");
    setRequestUser(session?.user.id ?? null);
    return session;
  },
  async signIn(email: string, password: string, register = false) {
    const session = await apiRequest<Session>("auth", "POST", { email, password, register });
    setRequestUser(session.user.id);
    listeners.forEach(fn => fn(session));
    return session;
  },
  async signOut() {
    if (!await flushPendingSaves()) throw new Error("Your edits have not synced. Retry saving before signing out.");
    await apiRequest("auth", "DELETE");
    setRequestUser(null);
    listeners.forEach(fn => fn(null));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
