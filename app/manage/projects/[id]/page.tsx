import Link from 'next/link';
import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import { getBoardById } from '@/lib/projects';
import { KanbanBoard, type KanbanColumn } from './KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function ManageProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();

  const { id } = await params;
  const board = await getBoardById(Number(id));
  if (!board) notFound();

  const columns: KanbanColumn[] = board.columns.map((col) => ({
    id: col.id,
    title: col.title,
    cards: col.cards.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
    })),
  }));

  return (
    <div className="manage-shell">
      <header className="manage-topbar">
        <div>
          <Link href="/manage" className="manage-linkbtn">
            ← All projects
          </Link>
          <h1 className="manage-title">{board.name}</h1>
          <p className="manage-sub">Drag cards to reorder them or move them between columns.</p>
        </div>
        <Link href={`/projects/${board.id}`} className="manage-logout">
          View board
        </Link>
      </header>

      <KanbanBoard projectId={board.id} columns={columns} />
    </div>
  );
}
