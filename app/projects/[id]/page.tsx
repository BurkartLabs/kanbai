import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Board } from '@/components/Board';
import { getBoardById } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoardById(Number(id));
  if (!board) notFound();

  return (
    <div className="wrap">
      <div className="board-standalone">
        <Link href="/" className="board-close" aria-label="Back to boards">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Board board={board} />
      </div>
    </div>
  );
}
