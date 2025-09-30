import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Lobby() {
  const { user, lobby, createRoom, joinRoom } = useApp();
  const [roomId, setRoomId] = useState("");
  const nav = useNavigate();

  async function handleCreate() {
    const room = await createRoom();
    nav(`/event/${room.id}`);
  }
  async function handleJoin(e) {
    e.preventDefault();
    if (!roomId.trim()) return;
    const room = await joinRoom(roomId.trim());
    nav(`/event/${room.id}`);
  }

  return (
    <main>
      <div className="status" style={{ marginBottom: 16 }}>
        You’re in the lobby as <strong>{user.name}</strong>
      </div>

      <div className="game" style={{ gridTemplateColumns: "1fr" }}>
        <section className="game-info">
          <h3 style={{ marginTop: 0 }}>Start a new event</h3>
          <button className="reset-btn" onClick={handleCreate}>
            Create room
          </button>
        </section>

        <section className="game-info">
          <h3 style={{ marginTop: 0 }}>Join an existing room</h3>
          <form onSubmit={handleJoin} style={{ display: "flex", gap: 8 }}>
            <input
              className="history-btn"
              style={{ flex: 1, padding: 10 }}
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button className="reset-btn" type="submit">
              Join
            </button>
          </form>
        </section>

        <section className="game-info">
          <h3 style={{ marginTop: 0 }}>Recent rooms</h3>
          <ul>
            {lobby.rooms.length === 0 && <li>No rooms yet</li>}
            {lobby.rooms.map((r) => (
              <li key={r.id}>
                <button
                  className="history-btn"
                  onClick={() => nav(`/event/${r.id}`)}>
                  Go to room <strong>{r.id}</strong>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
