// Simple realtime Tic-Tac-Toe server with turn enforcement (in-memory).
// Run:  node server/index.js
// Deps: npm i express socket.io cors

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Vite dev
    methods: ["GET", "POST"],
  },
});

// ---------- In-memory store ----------
/** @type {Map<string, EventState>} */
const events = new Map();

/**
 * @typedef {{
 *  id: string,
 *  title: string,
 *  players: Array<{name:string, socketId:string, mark:'X'|'O'}>,
 *  stage: 'idle'|'playing'|'finished',
 *  firstPlayer: 'X'|'O',
 *  currentMove: number,
 *  history: (('X'|'O'|null)[])[],
 *  scores: {X:number, O:number, Draw:number},
 * }} EventState
 */

function makeEvent({ title, creatorName, creatorSocketId }) {
  const id = crypto.randomBytes(3).toString("base64url"); // ex: kKkMt
  const event = {
    id,
    title: title || "Untitled",
    players: [{ name: creatorName, socketId: creatorSocketId, mark: "X" }],
    stage: "idle",
    firstPlayer: "X",
    currentMove: 0,
    history: [Array(9).fill(null)],
    scores: { X: 0, O: 0, Draw: 0 },
  };
  events.set(id, event);
  return event;
}

function calcWinner(sq) {
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
    if (sq[a] && sq[a] === sq[b] && sq[a] === sq[c]) {
      return { player: sq[a], line: [a, b, c] };
    }
  }
  return null;
}

function currentMark(e) {
  const xIsNext =
    e.currentMove % 2 === 0 ? e.firstPlayer === "X" : e.firstPlayer !== "X";
  return xIsNext ? "X" : "O";
}

function broadcastState(eventId) {
  const event = events.get(eventId);
  if (!event) return;
  io.to(eventId).emit("event:state", event);
}

io.on("connection", (socket) => {
  socket.on("user:hello", (userName) => {
    socket.data.userName = userName || `User-${socket.id.slice(0, 4)}`;
  });

  socket.on("events:list", () => {
    const list = [...events.values()].map((e) => ({
      id: e.id,
      title: e.title,
      players: e.players.map((p) => p.name),
    }));
    socket.emit("events:list:result", list);
  });

  socket.on("event:create", ({ title }, cb) => {
    const userName = socket.data.userName || "Anonymous";
    const event = makeEvent({
      title,
      creatorName: userName,
      creatorSocketId: socket.id,
    });
    socket.join(event.id);
    cb?.(event.id);
    broadcastState(event.id);
    io.emit("events:changed");
  });

  socket.on("event:join", ({ id }, cb) => {
    const event = events.get(id);
    if (!event) return cb?.({ ok: false, error: "No such room." });

    const already = event.players.find((p) => p.socketId === socket.id);
    if (!already) {
      if (event.players.length >= 2)
        return cb?.({ ok: false, error: "Room full." });
      const mark = event.players.some((p) => p.mark === "X") ? "O" : "X";
      event.players.push({
        name: socket.data.userName || "Guest",
        socketId: socket.id,
        mark,
      });
    }
    socket.join(event.id);
    cb?.({ ok: true, id: event.id });
    broadcastState(event.id);
    io.emit("events:changed");
  });

  socket.on("event:start", ({ id, firstPlayer }) => {
    const e = events.get(id);
    if (!e) return;
    if (e.players.length < 2) {
      socket.emit("event:error", "Need two players to start.");
      return;
    }
    e.firstPlayer = firstPlayer === "O" ? "O" : "X";
    e.history = [Array(9).fill(null)];
    e.currentMove = 0;
    e.stage = "playing";
    broadcastState(id);
  });

  socket.on("event:play", ({ id, index }) => {
    const e = events.get(id);
    if (!e || e.stage !== "playing") return;

    const mustMark = currentMark(e);
    const me = e.players.find((p) => p.socketId === socket.id);
    if (!me) return socket.emit("event:error", "You are not in this room.");
    if (me.mark !== mustMark)
      return socket.emit("event:error", "Not your turn.");

    const squares = e.history[e.currentMove].slice();
    if (squares[index]) return; // occupied

    squares[index] = mustMark;
    const nextHistory = e.history.slice(0, e.currentMove + 1);
    e.history = [...nextHistory, squares];
    e.currentMove = nextHistory.length;
    broadcastState(id);
  });

  socket.on("event:clear", ({ id }) => {
    const e = events.get(id);
    if (!e) return;
    e.history = [Array(9).fill(null)];
    e.currentMove = 0;
    broadcastState(id);
  });

  socket.on("event:endRound", ({ id }) => {
    const e = events.get(id);
    if (!e) return;
    const squares = e.history[e.currentMove];
    const win = calcWinner(squares);
    if (win) e.scores[win.player] += 1;
    else if (squares.every(Boolean)) e.scores.Draw += 1;
    e.stage = "finished";
    broadcastState(id);
  });

  socket.on("event:playAgain", ({ id }) => {
    const e = events.get(id);
    if (!e) return;
    e.stage = "idle";
    e.history = [Array(9).fill(null)];
    e.currentMove = 0;
    broadcastState(id);
  });

  socket.on("event:jump", ({ id, move }) => {
    const e = events.get(id);
    if (!e || e.stage !== "playing") return;
    // Optional: allow only current player to time-travel
    const mustMark = currentMark(e);
    const me = e.players.find((p) => p.socketId === socket.id);
    if (!me || me.mark !== mustMark) return;

    if (move >= 0 && move < e.history.length) {
      e.currentMove = move;
      broadcastState(id);
    }
  });

  socket.on("disconnect", () => {
    for (const e of events.values()) {
      const before = e.players.length;
      e.players = e.players.filter((p) => p.socketId !== socket.id);
      if (e.players.length !== before) {
        broadcastState(e.id);
        io.emit("events:changed");
      }
      if (e.players.length === 0) {
        events.delete(e.id);
        io.emit("events:changed");
      }
    }
  });
});

app.get("/", (_req, res) => res.send("<h1>TicTacToe Realtime</h1>"));
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
