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
  /** Avatar icon ID (from user profile) when note was created */
  authorIconId?: string;
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

/** Recurrence: number of days between due dates (e.g. 1 = daily, 7 = weekly) */
export type Chore = {
  id: string;
  title: string;
  assignee: string;
  /** Days between due dates (e.g. 1 = daily, 7 = weekly, 30 = monthly) */
  frequencyDays: number;
  /** Timestamp when the chore was last marked done; next due = lastDoneAt + frequencyDays */
  lastDoneAt: number | null;
  createdAt: number;
};
