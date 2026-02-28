import Link from "next/link";
import { JoinBoardForm } from "./JoinBoardForm";

export default function Home() {
  const boardId = crypto.randomUUID?.()
    ? crypto.randomUUID().slice(0, 8)
    : "demo-board";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-100 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Real-time sticky notes
        </h1>
        <p className="mt-2 text-zinc-600">
          Create a board and share the link. Everyone with the link sees the
          same stickies and updates in real time.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={`/board/${boardId}`}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-center font-medium text-white transition hover:bg-zinc-800"
        >
          New board
        </Link>
        <JoinBoardForm />
      </div>
      <p className="text-sm text-zinc-500">
        Powered by Firebase Firestore · Real-time multiplayer
      </p>
    </div>
  );
}
