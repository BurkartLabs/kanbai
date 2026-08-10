import type { RowDataPacket } from 'mysql2';
import { pool } from './db';

interface ProjectRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
}

interface ColumnRow extends RowDataPacket {
  id: number;
  project_id: number;
  title: string;
  order: number;
}

interface CardRow extends RowDataPacket {
  id: number;
  project_id: number;
  column_id: number;
  title: string;
  description: string | null;
  order: number;
}

export type BoardStatus = 'in-progress' | 'completed';

export type BoardSummary = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  status: BoardStatus;
  columnCounts: { title: string; count: number }[];
};

export type BoardCard = {
  id: number;
  title: string;
  description: string | null;
  order: number;
};

export type BoardColumn = {
  id: number;
  title: string;
  order: number;
  cards: BoardCard[];
};

export type Board = {
  id: number;
  name: string;
  description: string | null;
  externalUrl: string | null;
  columns: BoardColumn[];
};

export async function getBoardSummaries(): Promise<BoardSummary[]> {
  const [projects] = await pool.query<ProjectRow[]>(
    'SELECT id, name, description, image_url, external_url FROM projects WHERE id != 0 ORDER BY id'
  );

  const [defaultColumns] = await pool.query<ColumnRow[]>(
    'SELECT id, project_id, title, `order` FROM columns WHERE project_id = 0 ORDER BY `order`'
  );

  const doneColumn = defaultColumns.find((col) => col.title === 'Done');

  const summaries: BoardSummary[] = [];

  for (const project of projects) {
    const [columns] = await pool.query<ColumnRow[]>(
      'SELECT id, project_id, title, `order` FROM columns WHERE project_id = 0 OR project_id = ? ORDER BY `order`',
      [project.id]
    );

    const [cards] = await pool.query<CardRow[]>(
      'SELECT id, project_id, column_id, title, description, `order` FROM cards WHERE project_id = ?',
      [project.id]
    );

    const columnCounts = columns.map((col) => ({
      title: col.title,
      count: cards.filter((card) => card.column_id === col.id).length,
    }));

    const isCompleted =
      cards.length > 0 &&
      doneColumn !== undefined &&
      cards.every((card) => card.column_id === doneColumn.id);

    summaries.push({
      id: project.id,
      name: project.name,
      description: project.description,
      imageUrl: project.image_url,
      externalUrl: project.external_url,
      status: isCompleted ? 'completed' : 'in-progress',
      columnCounts,
    });
  }

  return summaries;
}

export async function getBoardById(id: number): Promise<Board | null> {
  if (!Number.isFinite(id) || id <= 0) return null;

  const [projects] = await pool.query<ProjectRow[]>(
    'SELECT id, name, description, image_url, external_url FROM projects WHERE id = ? LIMIT 1',
    [id]
  );
  const project = projects[0];
  if (!project) return null;

  const [columns] = await pool.query<ColumnRow[]>(
    'SELECT id, project_id, title, `order` FROM columns WHERE project_id = 0 OR project_id = ? ORDER BY `order`',
    [id]
  );

  const [cards] = await pool.query<CardRow[]>(
    'SELECT id, project_id, column_id, title, description, `order` FROM cards WHERE project_id = ? ORDER BY `order`',
    [id]
  );

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    externalUrl: project.external_url,
    columns: columns.map((col) => ({
      id: col.id,
      title: col.title,
      order: col.order,
      cards: cards
        .filter((card) => card.column_id === col.id)
        .map((card) => ({
          id: card.id,
          title: card.title,
          description: card.description,
          order: card.order,
        })),
    })),
  };
}