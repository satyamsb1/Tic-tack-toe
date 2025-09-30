// Pretend network API. will be swapping these out later with real fetch/axios calls.

let _rooms = {};
function randId() {
  return Math.random().toString(36).slice(2, 8);
}

export async function createRoom() {
  const id = randId();
  _rooms[id] = { id, createdAt: Date.now() };
  return { id };
}

export async function joinRoom(roomId) {
  if (!_rooms[roomId]) _rooms[roomId] = { id: roomId, createdAt: Date.now() };
  return { id: roomId };
}

export function resetMock() {
  _rooms = {};
}
