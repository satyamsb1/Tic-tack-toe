import { useState } from "react";
import "./index.css"; // or "./App.css" if you prefer

function Square({ value, onClick, isWinning }) {
  return (
    <button
      className={`square ${isWinning ? "square--win" : ""}`}
      onClick={onClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  const winnerInfo = calculateWinner(squares);
  const winner = winnerInfo?.player ?? null;

  function handleClick(i) {
    if (squares[i] || winner) return;

    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares);
  }

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (squares.every(Boolean)) {
    status = "Draw!";
  } else {
    status = `Next player: ${xIsNext ? "X" : "O"}`;
  }

  const winningLine = winnerInfo?.line ?? [];

  return (
    <>
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
    </>
  );
}

export default function App() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(move) {
    setCurrentMove(move);
  }

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>
          {history.map((squares, move) => {
            const desc =
              move === 0 ? "Go to game start" : `Go to move #${move}`;
            return (
              <li key={move}>
                <button
                  className={`history-btn ${
                    move === currentMove ? "history-btn--active" : ""
                  }`}
                  onClick={() => jumpTo(move)}>
                  {desc}
                </button>
              </li>
            );
          })}
        </ol>
        <button
          className="reset-btn"
          onClick={() => {
            setHistory([Array(9).fill(null)]);
            setCurrentMove(0);
          }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// Helpers
function calculateWinner(squares) {
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
  for (const line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line };
    }
  }
  return null;
}
