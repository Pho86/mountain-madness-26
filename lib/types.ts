export type StickyNote = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
};

export type BoardState = {
  notes: StickyNote[];
};

// Events the server sends to clients
export type ServerToClientEvents = {
  "board:state": (state: BoardState) => void;
  "note:added": (note: StickyNote) => void;
  "note:updated": (note: StickyNote) => void;
  "note:deleted": (id: string) => void;
};

// Events the client sends to server
export type ClientToServerEvents = {
  "board:join": (boardId: string) => void;
  "board:leave": (boardId: string) => void;
  "note:add": (boardId: string, note: StickyNote) => void;
  "note:update": (boardId: string, note: StickyNote) => void;
  "note:delete": (boardId: string, id: string) => void;
};
