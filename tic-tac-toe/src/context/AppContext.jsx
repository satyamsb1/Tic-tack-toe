import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { socket } from "../services/socket";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState({ name: "" });
  const [connected, setConnected] = useState(false);

  // Connect socket after we have a username
  useEffect(() => {
    if (!user?.name) return;
    if (!connected) {
      socket.connect();
      socket.emit("user:hello", user.name);
      setConnected(true);
    }
  }, [user, connected]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      socketConnected: connected,
    }),
    [user, connected]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
