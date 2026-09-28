import { ProgressCardLink } from '@/components/ProgressCardLink';
import { ProductCard } from '@/components/ProductCard';
import { DistBar } from '@/components/DistBar';
import { getBoardSummaries, type BoardSummary } from '@/lib/projects';
import { getProductSnapshots, type ProductSnapshot } from '@/lib/ado';

export const dynamic = 'force-dynamic';

type Entry = { board: BoardSummary; snapshot: ProductSnapshot | null };

function ticketId(name: string, id: number) {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRJ';
  return `${prefix}-${String(id).padStart(3, '0')}`;
}

function countFor(board: BoardSummary, title: string) {
  return board.columnCounts.find((c) => c.title === title)?.count ?? 0;
}

/**
 * A board tracked only here: its cards are the progress. With no cards yet there is no bar and
 * nothing to open, so the card carries its links instead of being one.
 */
function CardBoard({ board }: { board: BoardSummary }) {
  const hasCards = board.columnCounts.some((c) => c.count > 0);
  const body = (
    <>
      {board.imageUrl && <img className="card-image" src={board.imageUrl} alt={`${board.name} screenshot`} />}
      <div className="ticket-row">
        <span className="ticket-id">{ticketId(board.name, board.id)}</span>
        <span className="status-chip">IN PROGRESS</span>
      </div>
      <h3>{board.name}</h3>
      <p>{board.description}</p>
    </>
  );

  if (hasCards) {
    return (
      <ProgressCardLink href={`/projects/${board.id}`}>
        {body}
        <DistBar
          bands={{
            backlog: countFor(board, 'To Do'),
            inProgress: countFor(board, 'In Progress'),
            done: countFor(board, 'Done'),
          }}
        />
      </ProgressCardLink>
    );
  }

  return (
    <article className="progress-card product-card">
      {body}
      {(board.externalUrl || board.repoUrl) && (
        <div className="product-links">
          {board.externalUrl && (
            <a href={board.externalUrl} className="view-btn">
              Visit →
            </a>
          )}
          {board.repoUrl && (
            <a href={board.repoUrl} className="view-btn">
              Source →
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default async function HomePage() {
  const boards = await getBoardSummaries();
  const snapshots = await getProductSnapshots(boards.flatMap((b) => (b.adoSlug ? [b.adoSlug] : [])));
  const entries: Entry[] = boards.map((board) => ({
    board,
    snapshot: board.adoSlug ? (snapshots.get(board.adoSlug) ?? null) : null,
  }));

  // Which projects appear is decided in /manage, by adding them. A linked project whose progress did
  // not come through (tracker unreachable, or not configured) falls back to its own cards.
  const visible = entries;
  const isShipped = (e: Entry) => (e.snapshot ? e.snapshot.stage === 'Live' : e.board.status === 'completed');
  const active = visible.filter((e) => !isShipped(e));
  const shipped = visible.filter(isShipped);
  const featured = active.filter((e) => e.board.featured && e.snapshot !== null);
  const rest = active.filter((e) => !featured.includes(e));

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">THIS BOARD IS LIVE</div>
          <h1>Hi, I&apos;m Paul Burkart.</h1>
          <h1>This is a live board of everything I&apos;m currently breaking and fixing.</h1>
          <p>
            I&apos;ve always used Kanban boards to track my work. I figured, why not integrate this directly into
            my portfolio.
          </p>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--backlog)' }} />
              Backlog
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--indigo)' }} />
              In Progress
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--amber)' }} />
              In Review
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--forest)' }} />
              Done
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="section-head">
            <h2>In progress</h2>
            <span className="count">
              {active.length} active {active.length === 1 ? 'board' : 'boards'}
            </span>
          </div>
          <p className="section-sub">This is what is currently in the works</p>

          {featured.length > 0 && (
            <div className="featured-grid">
              {featured.map((e) => (
                <ProductCard key={e.board.id} board={e.board} snapshot={e.snapshot!} variant="featured" />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="progress-grid">
              {rest.map((e) =>
                e.snapshot ? (
                  <ProductCard key={e.board.id} board={e.board} snapshot={e.snapshot} variant="compact" />
                ) : (
                  <CardBoard key={e.board.id} board={e.board} />
                )
              )}
            </div>
          )}

          {active.length === 0 && <p className="section-sub">Nothing on the bench right now.</p>}
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <h2>Completed</h2>
            <span className="count">{shipped.length} shipped</span>
          </div>
          <p className="section-sub">Boards I&apos;ve closed out</p>

          <div className="completed-grid">
            {shipped.map(({ board }) => (
              <div className="completed-card" key={board.id}>
                {board.imageUrl && <img src={board.imageUrl} alt={`${board.name} screenshot`} />}
                <div className="completed-body">
                  <span className="completed-status">{board.adoSlug ? 'LIVE' : 'DONE'}</span>
                  <h3>{board.name}</h3>
                  <p>{board.description}</p>
                  {(board.externalUrl || board.repoUrl) && (
                    <div className="completed-links">
                      {board.externalUrl && (
                        <a href={board.externalUrl} className="view-btn">
                          View project →
                        </a>
                      )}
                      {board.repoUrl && (
                        <a href={board.repoUrl} className="view-btn">
                          Source →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <footer>
          <span>Built with Next.js & TypeScript : Deployed on Vercel : DB Hosted on TiDB</span>
          <span>© 2026</span>
        </footer>
      </div>
    </>
  );
}
