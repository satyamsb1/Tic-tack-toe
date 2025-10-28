import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { socket } from "../services/socket";

// local winner helper (UI only; server is authoritative)
function calculateWinner(s) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (s[a] && s[a] === s[b] && s[a] === s[c])
      return { player: s[a], line: [a, b, c] };
  }
  return null;
}

function Square({ value, onClick, isWinning, disabled }) {
  return (
    <button
      className={`square ${isWinning ? "square--win" : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={disabled ? { cursor: "not-allowed", opacity: 0.7 } : {}}>
      {value}
    </button>
  );
}

export default function Event() {
  const { roomId } = useParams();
  const nav = useNavigate();
  const { user } = useApp();

  // Event state mirrored from server
  const [event, setEvent] = useState(null);
  const [socketId, setSocketId] = useState(socket.id);

  // Keep socket id up to date (reconnects change it)
  useEffect(() => {
    const onConnect = () => setSocketId(socket.id);
    socket.on("connect", onConnect);
    return () => socket.off("connect", onConnect);
  }, []);

  // Join room + subscribe to state (RUNS ALWAYS; no conditional hooks)
  useEffect(() => {
    socket.emit("event:join", { id: roomId }, (res) => {
      if (!res?.ok) {
        alert(res?.error || "Unable to join room.");
        nav("/lobby");
      }
    });
    const onState = (state) => {
      if (state.id === roomId) setEvent(state);
    };
    socket.on("event:state", onState);
    socket.emit("events:list"); // keep lobby fresh elsewhere
    return () => socket.off("event:state", onState);
  }, [roomId, nav]);

  // ---- Derivations (ALWAYS CALL HOOKS; guard with defaults) ----
  const squares = useMemo(
    () => (event ? event.history[event.currentMove] : Array(9).fill(null)),
    [event]
  );

  const localWin = useMemo(() => calculateWinner(squares), [squares]);
  const isDraw = useMemo(
    () => !localWin && squares.every(Boolean),
    [localWin, squares]
  );

  const stage = event?.stage ?? "idle";
  const firstPlayer = event?.firstPlayer ?? "X";
  const currentMove = event?.currentMove ?? 0;

  const xIsNext =
    currentMove % 2 === 0 ? firstPlayer === "X" : firstPlayer !== "X";
  const turnMark = xIsNext ? "X" : "O";

  const players = event?.players ?? [];
  const me = players.find((p) => p.socketId === socketId);
  const myMark = me?.mark;

  const canPlay = stage === "playing" && myMark === turnMark && !localWin;

  const status =
    stage !== "playing"
      ? "Ready"
      : localWin
      ? `Winner: ${localWin.player}`
      : isDraw
      ? "Draw"
      : myMark === turnMark
      ? `Your turn (${turnMark})`
      : `Waiting for opponent (${turnMark})`;

  const scores = event?.scores ?? { X: 0, O: 0, Draw: 0 };
  const winningLine = localWin?.line ?? [];

  // ---- Actions to server (guard with event?.id) ----
  const startMatch = (first) =>
    event && socket.emit("event:start", { id: event.id, firstPlayer: first });
  const playAt = (i) =>
    event && canPlay && socket.emit("event:play", { id: event.id, index: i });
  const clearBoard = () =>
    event && socket.emit("event:clear", { id: event.id });
  const endRound = () =>
    event && socket.emit("event:endRound", { id: event.id });
  const playAgain = () =>
    event && socket.emit("event:playAgain", { id: event.id });
  const jumpTo = (m) =>
    event && socket.emit("event:jump", { id: event.id, move: m });

  // ---- Render ----
  // NOTE: We still show a lightweight "connecting..." UI,
  // but hooks above already ran with safe defaults, keeping order stable.
  if (!event) {
    return (
      <main style={{ maxWidth: 860, margin: "32px auto", padding: "0 16px" }}>
        <p>
          Connecting to room <code>{roomId}</code>…
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <div
        className="status"
        style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span>
          Room <strong>{event.id}</strong> — <strong>{event.title}</strong>
        </span>
        <span>
          Players: {players.map((p) => `${p.name}(${p.mark})`).join(", ")}
        </span>
        <span className="badges">
          <span className="badge">X {scores.X}</span>
          <span className="badge">O {scores.O}</span>
          <span className="badge">Draw {scores.Draw}</span>
        </span>
      </div>

      {stage === "idle" && (
        <section className="game-info" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Start stage</h3>
          <p>Choose who starts and begin the match (needs two players).</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="reset-btn" onClick={() => startMatch("X")}>
              First: X
            </button>
            <button className="reset-btn" onClick={() => startMatch("O")}>
              First: O
            </button>
            <Link to="/lobby" className="history-btn">
              ← Back to lobby
            </Link>
          </div>
        </section>
      )}

      <div className="game">
        <div className="game-board">
          <div className="status" aria-live="polite">
            {status}
          </div>

          {[
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
          ].map((row, rIdx) => (
            <div
              key={rIdx}
              className={`board-row ${!canPlay ? "board-row--locked" : ""}`}>
              {row.map((i) => (
                <Square
                  key={i}
                  value={squares[i]}
                  onClick={() => playAt(i)}
                  isWinning={winningLine.includes(i)}
                  disabled={!canPlay || !!squares[i]}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="game-info">
          <h3 style={{ marginTop: 0 }}>Controls</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="reset-btn" onClick={clearBoard}>
              Clear board
            </button>
            {(localWin || squares.every(Boolean)) && (
              <button className="reset-btn" onClick={endRound}>
                End Round
              </button>
            )}
            <button
              className="history-btn"
              onClick={() => (window.location.href = "/lobby")}>
              Exit to lobby
            </button>
          </div>

          {stage === "finished" && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ marginTop: 0 }}>End stage</h3>
              <p>
                {localWin ? (
                  <>
                    🏆 <strong>{localWin.player}</strong> wins!
                  </>
                ) : (
                  "It’s a draw."
                )}
              </p>
              <button className="reset-btn" onClick={playAgain}>
                Play again
              </button>
            </>
          )}

          <hr style={{ margin: "12px 0" }} />
          <h4 style={{ margin: "8px 0" }}>Move History</h4>
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {event.history.map((_, move) => {
              const isCurrent = move === event.currentMove;
              const text =
                move === 0 ? "Go to game start" : `Go to move #${move}`;
              return (
                <li key={move} style={{ marginBottom: 6 }}>
                  <button
                    className={`history-btn ${
                      isCurrent ? "history-btn--active" : ""
                    }`}
                    onClick={() => jumpTo(move)}>
                    {isCurrent ? "(current) " : ""}
                    {text}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </main>
  );
}
