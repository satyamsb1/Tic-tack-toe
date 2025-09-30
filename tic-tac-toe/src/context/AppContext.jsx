import { createContext, useContext, useMemo, useState } from "react";
import * as api from "../services/api";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState({ name: "" });
  const [lobby, setLobby] = useState({ rooms: [] });

  function setName(name) {
    setUser((u) => ({ ...u, name }));
  }

  async function createRoom() {
    const room = await api.createRoom();
    setLobby((l) => ({ ...l, rooms: [...l.rooms, room] }));
    return room;
  }

  async function joinRoom(roomId) {
    const room = await api.joinRoom(roomId);
    if (!lobby.rooms.find((r) => r.id === room.id)) {
      setLobby((l) => ({ ...l, rooms: [...l.rooms, room] }));
    }
    return room;
  }

  function clearAll() {
    setUser({ name: "" });
    setLobby({ rooms: [] });
    api.resetMock();
  }

  const value = useMemo(
    () => ({ user, setName, lobby, createRoom, joinRoom, clearAll }),
    [user, lobby]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
