import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { socket } from "../services/socket";

export default function Lobby() {
  const { user } = useApp();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [events, setEvents] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    const refresh = () => socket.emit("events:list");
    const onList = (list) => setEvents(list);

    refresh();
    socket.on("events:list:result", onList);
    socket.on("events:changed", refresh);

    return () => {
      socket.off("events:list:result", onList);
      socket.off("events:changed", refresh);
    };
  }, []);

  const createEvent = () => {
    socket.emit("event:create", { title }, (id) => nav(`/event/${id}`));
  };

  const joinEvent = () => {
    socket.emit("event:join", { id: code.trim() }, (res) => {
      if (res?.ok) nav(`/event/${res.id}`);
      else alert(res?.error || "Unable to join.");
    });
  };

  return (
    <main style={{ maxWidth: 860, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ marginTop: 0 }}>Main Lobby</h1>
      <p>
        Hi {user?.name || "there"}! Create a new room or join an existing one.
      </p>

      <section className="game-info" style={{ margin: "16px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Room title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="history-btn"
            style={{ flex: 1 }}
          />
          <button className="reset-btn" onClick={createEvent}>
            Create
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Enter room code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="history-btn"
            style={{ flex: 1 }}
          />
          <button className="history-btn" onClick={joinEvent}>
            Join
          </button>
        </div>
      </section>

      <section className="game-info">
        <h3 style={{ marginTop: 0 }}>Active Rooms</h3>
        {events.length === 0 ? (
          <p>No rooms yet. Create one above.</p>
        ) : (
          <ul>
            {events.map((e) => (
              <li key={e.id} style={{ marginBottom: 8 }}>
                <div>
                  <strong>{e.title}</strong> — Code: <code>{e.id}</code> —
                  Players: {e.players.join(", ") || "—"}
                </div>
                <Link
                  to={`/event/${e.id}`}
                  className="history-btn"
                  style={{ marginTop: 6, display: "inline-block" }}>
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
