import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Square({ value, onClick, isWinning }) {
  return (
    <button
      className={`square ${isWinning ? "square--win" : ""}`}
      onClick={onClick}>
      {value}
    </button>
  );
}

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

export default function Event() {
  const { roomId } = useParams();
  const nav = useNavigate();
  const { user } = useApp();

  // GAME STATE
  const [started, setStarted] = useState(false);
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [move, setMove] = useState(0); // 0..8
  const xIsNext = move % 2 === 0;

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const isDraw = !winnerInfo && squares.every(Boolean);
  const hasEnded = Boolean(winnerInfo) || isDraw;

  function startGame() {
    setStarted(true);
    resetGame();
  }
  function resetGame() {
    setSquares(Array(9).fill(null));
    setMove(0);
  }
  function handleClick(i) {
    if (!started || hasEnded || squares[i]) return;
    const next = squares.slice();
    next[i] = xIsNext ? "X" : "O";
    setSquares(next);
    setMove((m) => m + 1);
  }

  const status = !started
    ? "Ready to start"
    : winnerInfo
    ? `Winner: ${winnerInfo.player}`
    : isDraw
    ? "Draw!"
    : `Next player: ${xIsNext ? "X" : "O"}`;

  const winningLine = winnerInfo?.line ?? [];

  return (
    <main>
      <div className="status">
        Room <strong>{roomId}</strong> • Player: <strong>{user.name}</strong>
      </div>

      {/* START STAGE */}
      {!started && (
        <section className="game-info" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Start stage</h3>
          <p>When both players are in, click start.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="reset-btn" onClick={startGame}>
              Start Game
            </button>
            <Link
              to="/lobby"
              className="history-btn"
              style={{ display: "inline-flex", alignItems: "center" }}>
              ← Back to lobby
            </Link>
          </div>
        </section>
      )}

      {/* GAME BOARD */}
      <div className="game">
        <div className="game-board">
          <div className="status">{status}</div>

          <div className="board-row">
            {[0, 1, 2].map((i) => (
              <Square
                key={i}
                value={squares[i]}
                onClick={() => handleClick(i)}
                isWinning={winningLine.includes(i)}
              />
            ))}
          </div>
          <div className="board-row">
            {[3, 4, 5].map((i) => (
              <Square
                key={i}
                value={squares[i]}
                onClick={() => handleClick(i)}
                isWinning={winningLine.includes(i)}
              />
            ))}
          </div>
          <div className="board-row">
            {[6, 7, 8].map((i) => (
              <Square
                key={i}
                value={squares[i]}
                onClick={() => handleClick(i)}
                isWinning={winningLine.includes(i)}
              />
            ))}
          </div>
        </div>

        {/* SIDE PANEL: CONTROLS + END STAGE */}
        <div className="game-info">
          <h3 style={{ marginTop: 0 }}>Controls</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="reset-btn" onClick={resetGame}>
              Restart round
            </button>
            <button className="history-btn" onClick={() => nav("/lobby")}>
              Exit to lobby
            </button>
          </div>

          {hasEnded && (
            <>
              <hr style={{ margin: "12px 0" }} />
              <h3 style={{ marginTop: 0 }}>End stage</h3>
              <p>
                {winnerInfo ? (
                  <>
                    🏆 <strong>{winnerInfo.player}</strong> wins!
                  </>
                ) : (
                  "It’s a draw."
                )}
              </p>
              <button className="reset-btn" onClick={startGame}>
                Play again
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
