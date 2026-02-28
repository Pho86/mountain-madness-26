import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.WS_PORT || 3001;
const NEXT_ORIGIN = process.env.NEXT_ORIGIN || "http://localhost:3000";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: NEXT_ORIGIN, methods: ["GET", "POST"] },
});

// In-memory state per board: { [boardId]: { notes: StickyNote[] } }
const boards = new Map();

function getBoard(boardId) {
  if (!boards.has(boardId)) {
    boards.set(boardId, { notes: [] });
  }
  return boards.get(boardId);
}

io.on("connection", (socket) => {
  socket.on("board:join", (boardId) => {
    socket.join(boardId);
    const board = getBoard(boardId);
    socket.emit("board:state", { notes: board.notes });
  });

  socket.on("board:leave", (boardId) => {
    socket.leave(boardId);
  });

  socket.on("note:add", (boardId, note) => {
    if (!boardId) return;
    const board = getBoard(boardId);
    board.notes.push(note);
    io.to(boardId).emit("note:added", note);
  });

  socket.on("note:update", (boardId, note) => {
    if (!boardId) return;
    const board = getBoard(boardId);
    const i = board.notes.findIndex((n) => n.id === note.id);
    if (i !== -1) board.notes[i] = note;
    io.to(boardId).emit("note:updated", note);
  });

  socket.on("note:delete", (boardId, id) => {
    if (!boardId) return;
    const board = getBoard(boardId);
    board.notes = board.notes.filter((n) => n.id !== id);
    io.to(boardId).emit("note:deleted", id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket server at http://localhost:${PORT}`);
});
