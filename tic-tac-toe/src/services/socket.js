import { io } from "socket.io-client";

// Set VITE_SOCKET_URL in .env if needed; defaults to localhost:3000
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export const socket = io(URL, { autoConnect: false });

// Helper to wait once for an event
export function once(event) {
  return new Promise((resolve) => {
    const handler = (payload) => {
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });
}
