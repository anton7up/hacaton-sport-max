import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import { platformService } from "../services/platform";
import type { User } from "../types";
type Ctx = { user: User | null; reload: () => Promise<void> };
const Context = createContext<Ctx>({ user: null, reload: async () => {} });
export function DemoUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const reload = async () => setUser(await api.user());
  useEffect(() => {
    reload();
  }, []);
  return (
    <Context.Provider value={{ user, reload }}>{children}</Context.Provider>
  );
}

export function MaxUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const started = useRef(false);
  const reload = async () => setUser(await api.user());
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const initData = platformService.getCurrentUserData();
    if (initData)
      void api
        .maxAuth(initData)
        .then(setUser)
        .catch(() => setUser(null));
  }, []);
  return (
    <Context.Provider value={{ user, reload }}>{children}</Context.Provider>
  );
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  return platformService.getPlatform() === "max" ? (
    <MaxUserProvider>{children}</MaxUserProvider>
  ) : (
    <DemoUserProvider>{children}</DemoUserProvider>
  );
}
export const useCurrentUser = () => useContext(Context);
