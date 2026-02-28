export type StickyNote = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  /** Font size in pixels (e.g. 16). Presets: Small=12, Medium=16, Large=20 */
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  listStyle?: "none" | "bullet";
  createdAt: number;
  authorName?: string;
};

export type BoardState = {
  notes: StickyNote[];
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitCount: number;
  createdAt: number;
};
