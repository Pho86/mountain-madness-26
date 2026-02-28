This is a [Next.js](https://nextjs.org) project for **Waifu Fridge**: user accounts (Firebase Auth), with **Firestore** for real-time sticky notes, chore charts, and cost splitting.

## Features

- **Firebase Authentication** — Sign in / Sign up with email and password.
- **Sticky notes** — Share a board link; everyone sees the same stickies in real time.
- **Chore charts & cost splitting** — Firestore structure is set up so you can add these next (see below).

### 1. Firebase project (waifu-fridge)

1. In [Firebase Console](https://console.firebase.google.com/) for **waifu-fridge**:
   - Enable **Authentication** → Sign-in method → **Email/Password** (enable).
   - Create **Firestore Database** if you haven’t (test mode for dev).
2. In Project settings → Your apps → Web app, copy the config.

### 2. Env

Copy `.env.example` to `.env.local` and fill in your Firebase config (do **not** commit `.env.local`):

```bash
cp .env.example .env.local
```

Set every `NEXT_PUBLIC_FIREBASE_*` from the web app config. Add `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` if you use Analytics.

> **Important:** Keep your real API keys and config in `.env.local` only (it is gitignored). Do not commit `.env.local` or paste secrets into `.env.example`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Sign in** / **Sign up** (e.g. `/login`). Sticky boards work with or without an account; when you’re ready you can tie boards to users.

### Firestore structure (real-time)

| Collection path | Purpose |
|------------------|--------|
| `boards/{boardId}/notes/{noteId}` | Sticky notes (id, x, y, text, color, createdAt). |
| `boards/{boardId}` | Optional: board metadata (name, ownerId, createdAt). |
| *(for later)* `households/{householdId}/chores/{choreId}` | Chore charts: chore fields (title, assigneeId, dueDate, done, etc.). |
| *(for later)* `households/{householdId}/expenses/{expenseId}` | Cost splitting: expense fields (amount, description, paidBy, splitBetween, etc.). |

Sticky notes are already wired; chore charts and cost splitting can use the same pattern (e.g. `useChoresFirestore(householdId)`, `useExpensesFirestore(householdId)`) with `onSnapshot` for real-time updates.

### Security (production)

Tighten Firestore rules and Auth as needed, e.g. require `request.auth != null` for writes and scope by `userId` or `householdId`.

---

## Getting Started (default Next.js)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
