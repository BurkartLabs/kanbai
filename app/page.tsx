import { ProgressCardLink } from '@/components/ProgressCardLink';
import { getBoardSummaries, type BoardSummary } from '@/lib/projects';

export const dynamic = 'force-dynamic';

function DistBar({ todo, active, done }: { todo: number; active: number; done: number }) {
  const total = todo + active + done;
  const pct = (n: number) => `${total === 0 ? 0 : (n / total) * 100}%`;

  return (
    <>
      <div className="dist-bar">
        <span style={{ width: pct(todo), background: 'var(--backlog)' }} />
        <span style={{ width: pct(active), background: 'var(--indigo)' }} />
        <span style={{ width: pct(done), background: 'var(--forest)' }} />
      </div>
      <div className="dist-key">
        <span>{todo} backlog</span>
        <span>{active} active</span>
        <span>{done} done</span>
      </div>
    </>
  );
}

function ticketId(name: string, id: number) {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRJ';
  return `${prefix}-${String(id).padStart(3, '0')}`;
}

function countFor(board: BoardSummary, title: string) {
  return board.columnCounts.find((c) => c.title === title)?.count ?? 0;
}

export default async function HomePage() {
  const boards = await getBoardSummaries();
  const inProgress = boards.filter((b) => b.status === 'in-progress');
  const completed = boards.filter((b) => b.status === 'completed');

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">THIS BOARD IS LIVE</div>
          <h1>A live board of everything I&apos;m currently breaking and fixing.</h1>
          <p>
            This is how I actually track my work; broken into cards, moved across columns, and
            marked done when it&apos;s genuinely done. Below is what I&apos;m actively building,
            and what I&apos;ve already shipped.
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
            <span className="count">{inProgress.length} active boards</span>
          </div>
          <p className="section-sub">
            Currently pushing these forward — card counts pulled straight from each board&apos;s
            columns.
          </p>

          <div className="progress-grid">
            {inProgress.map((board) => (
              <ProgressCardLink href={`/projects/${board.id}`} key={board.id}>
                <div className="ticket-row">
                  <span className="ticket-id">{ticketId(board.name, board.id)}</span>
                  <span className="status-chip">IN PROGRESS</span>
                </div>
                <h3>{board.name}</h3>
                <p>{board.description}</p>
                <DistBar
                  todo={countFor(board, 'To Do')}
                  active={countFor(board, 'In Progress')}
                  done={countFor(board, 'Done')}
                />
              </ProgressCardLink>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <h2>Completed</h2>
            <span className="count">{completed.length} shipped</span>
          </div>
          <p className="section-sub">Boards I&apos;ve closed out — live, deployed, and done.</p>

          <div className="completed-grid">
            {completed.map((board) => (
              <div className="completed-card" key={board.id}>
                
                <img src={board.imageUrl ?? ''} alt={`${board.name} screenshot`} />
                <div className="completed-body">
                  <span className="completed-status">DONE</span>
                  <h3>{board.name}</h3>
                  <p>{board.description}</p>
                  <a href={board.externalUrl ?? '#'} className="view-btn">
                    View project →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <footer>
          <span>Built with Next.js, TypeScript &amp; MariaDB</span>
          <span>© 2026</span>
        </footer>
      </div>
    </>
  );
}