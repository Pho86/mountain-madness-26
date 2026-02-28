export type StickyNote = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  authorName?: string;
};

export type BoardState = {
  notes: StickyNote[];
};
