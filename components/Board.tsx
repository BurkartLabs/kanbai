import type { Board as BoardData } from '@/lib/projects';

function ticket(name: string, id: number) {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRJ';
  return `${prefix}-${String(id).padStart(3, '0')}`;
}

function columnAccent(title: string) {
  if (title === 'In Progress') return 'var(--indigo)';
  if (title === 'Done') return 'var(--forest)';
  return 'var(--backlog)';
}

function columnAccentSoft(title: string) {
  if (title === 'In Progress') return 'var(--indigo-soft)';
  if (title === 'Done') return 'var(--forest-soft)';
  return 'var(--backlog-soft)';
}

export function Board({ board }: { board: BoardData }) {
  const totalCards = board.columns.reduce((sum, c) => sum + c.cards.length, 0);

  return (
    <div className="board">
      <header className="board-topbar">
        <div className="board-topbar-row">
          <span className="board-topbar-ticket">{ticket(board.name, board.id)}</span>
          <span className="board-topbar-readonly">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
            </svg>
            Read-only
          </span>
        </div>
        <h2>{board.name}</h2>
        {board.description && <p>{board.description}</p>}
        <p className="board-topbar-stats">
          {board.columns.length} columns
          <span className="board-topbar-dot" />
          {totalCards} {totalCards === 1 ? 'card' : 'cards'}
        </p>
      </header>

      <div className="board-columns" role="list">
        {board.columns.map((col) => (
          <section
            className="board-column"
            key={col.id}
            role="listitem"
            style={{
              ['--column-accent' as string]: columnAccent(col.title),
              ['--column-accent-soft' as string]: columnAccentSoft(col.title),
            }}
          >
            <header className="board-column-head">
              <span className="board-column-dot" />
              <h3>{col.title}</h3>
              <span className="board-column-count">{col.cards.length}</span>
            </header>

            <div className="board-column-body">
              {col.cards.length === 0 ? (
                <p className="board-column-empty">No cards</p>
              ) : (
                col.cards.map((card) => (
                  <article className="board-card" key={card.id}>
                    <h4>{card.title}</h4>
                    {card.description && <p>{card.description}</p>}
                    <div className="board-card-foot">
                      <span className="board-card-chip">{col.title}</span>
                      <span className="board-card-id">{ticket(board.name, card.id)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
