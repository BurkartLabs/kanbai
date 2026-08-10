import { notFound } from 'next/navigation';
import { Board } from '@/components/Board';
import { Modal } from '@/components/Modal';
import { getBoardById } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function InterceptedProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoardById(Number(id));
  if (!board) notFound();

  return (
    <Modal>
      <Board board={board} />
    </Modal>
  );
}
