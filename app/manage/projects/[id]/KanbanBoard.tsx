'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { repositionCardAction } from '../../actions';
import { CardEditor, NewCardForm } from './CardForms';

export type KanbanCard = { id: number; title: string; description: string | null };
export type KanbanColumn = { id: number; title: string; cards: KanbanCard[] };

const cardKey = (id: number) => `card-${id}`;
const colKey = (id: number) => `col-${id}`;
const isColKey = (key: string) => key.startsWith('col-');
const idFromKey = (key: string) => Number(key.split('-')[1]);

function columnAccent(title: string) {
  if (title === 'In Progress') return 'var(--indigo)';
  if (title === 'Done') return 'var(--forest)';
  return 'var(--backlog)';
}

function SortableCard({
  card,
  projectId,
  disabled,
}: {
  card: KanbanCard;
  projectId: number;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardKey(card.id),
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`manage-card${isDragging ? ' is-dragging' : ''}`}
    >
      <div className="manage-card-top">
        <button
          type="button"
          className="manage-drag-handle"
          aria-label={`Reorder ${card.title}`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span className="manage-card-title">{card.title}</span>
      </div>
      {card.description && <p className="manage-card-desc">{card.description}</p>}
      <CardEditor card={card} projectId={projectId} />
    </li>
  );
}

function Column({
  column,
  projectId,
  children,
}: {
  column: KanbanColumn;
  projectId: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey(column.id) });

  return (
    <section
      className="manage-column"
      style={{ ['--column-accent' as string]: columnAccent(column.title) }}
    >
      <header className="manage-column-head">
        <span className="manage-column-dot" />
        <h2>{column.title}</h2>
        <span className="manage-column-count">{column.cards.length}</span>
      </header>

      <ul ref={setNodeRef} className={`manage-cards${isOver ? ' is-over' : ''}`}>
        {children}
        {column.cards.length === 0 && <li className="manage-cards-empty">Drop cards here</li>}
      </ul>

      <NewCardForm projectId={projectId} columnId={column.id} />
    </section>
  );
}

export function KanbanBoard({
  projectId,
  columns: serverColumns,
}: {
  projectId: number;
  columns: KanbanColumn[];
}) {
  const [columns, setColumns] = useState(serverColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const origin = useRef<{ columnId: number; index: number } | null>(null);

  const serverSignature = useMemo(
    () => JSON.stringify(serverColumns.map((c) => [c.id, c.cards.map((x) => x.id)])),
    [serverColumns]
  );
  const [syncedSignature, setSyncedSignature] = useState(serverSignature);
  if (serverSignature !== syncedSignature) {
    setSyncedSignature(serverSignature);
    setColumns(serverColumns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findColumnIndex = (key: string) => {
    if (isColKey(key)) return columns.findIndex((c) => c.id === idFromKey(key));
    return columns.findIndex((c) => c.cards.some((card) => cardKey(card.id) === key));
  };

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const found = col.cards.find((c) => cardKey(c.id) === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  function handleDragStart(event: DragStartEvent) {
    const key = String(event.active.id);
    setActiveId(key);
    setError(null);

    const ci = findColumnIndex(key);
    if (ci !== -1) {
      origin.current = {
        columnId: columns[ci].id,
        index: columns[ci].cards.findIndex((c) => cardKey(c.id) === key),
      };
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeKey = String(active.id);
    const overKey = String(over.id);

    const from = findColumnIndex(activeKey);
    const to = findColumnIndex(overKey);
    if (from === -1 || to === -1 || from === to) return;

    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const fromCards = next[from].cards;
      const moving = fromCards.findIndex((c) => cardKey(c.id) === activeKey);
      if (moving === -1) return prev;

      const [card] = fromCards.splice(moving, 1);
      const toCards = next[to].cards;
      const overIndex = isColKey(overKey)
        ? toCards.length
        : toCards.findIndex((c) => cardKey(c.id) === overKey);

      toCards.splice(overIndex === -1 ? toCards.length : overIndex, 0, card);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeKey = String(active.id);
    setActiveId(null);

    const started = origin.current;
    origin.current = null;
    if (!over || !started) return;

    const to = findColumnIndex(String(over.id));
    if (to === -1) return;

    let finalColumns = columns;
    const overKey = String(over.id);
    if (!isColKey(overKey)) {
      const from = findColumnIndex(activeKey);
      if (from === to) {
        const oldIndex = columns[to].cards.findIndex((c) => cardKey(c.id) === activeKey);
        const newIndex = columns[to].cards.findIndex((c) => cardKey(c.id) === overKey);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          finalColumns = columns.map((c, i) =>
            i === to ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) } : c
          );
          setColumns(finalColumns);
        }
      }
    }

    const targetColumn = finalColumns[to];
    const index = targetColumn.cards.findIndex((c) => cardKey(c.id) === activeKey);
    if (index === -1) return;

    if (started.columnId === targetColumn.id && started.index === index) return;

    const cardId = idFromKey(activeKey);
    startTransition(async () => {
      const result = await repositionCardAction(projectId, cardId, targetColumn.id, index);
      if (result.error) {
        setError(result.error);
        setColumns(serverColumns); 
      }
    });
  }

  return (
    <>
      {error && (
        <p className="manage-error" role="alert">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          origin.current = null;
          setColumns(serverColumns);
        }}
      >
        <div className="manage-columns">
          {columns.map((column) => (
            <Column key={column.id} column={column} projectId={projectId}>
              <SortableContext
                items={column.cards.map((c) => cardKey(c.id))}
                strategy={verticalListSortingStrategy}
              >
                {column.cards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    projectId={projectId}
                    disabled={false}
                  />
                ))}
              </SortableContext>
            </Column>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="manage-card manage-card-overlay">
              <div className="manage-card-top">
                <span className="manage-drag-handle">⠿</span>
                <span className="manage-card-title">{activeCard.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
