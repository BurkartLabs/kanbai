import Link from 'next/link';
import { DistBar } from './DistBar';
import type { BoardSummary } from '@/lib/projects';
import type { ProductSnapshot } from '@/lib/ado';
import { stageLabel } from '@/lib/ado-progress';

/** "today", "yesterday", "5 days ago", "3 weeks ago". Rendered on the server per request. */
export function ago(iso: string, now = Date.now()): string {
  const days = Math.max(0, Math.floor((now - Date.parse(iso)) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

/**
 * A project whose progress comes from the tracker. Featured gets the full
 * card with recent milestones; compact sits in the grid beside the
 * hand-tracked boards.
 */
export function ProductCard({
  board,
  snapshot,
  variant,
}: {
  board: BoardSummary;
  snapshot: ProductSnapshot;
  variant: 'featured' | 'compact';
}) {
  const featured = variant === 'featured';
  const hasCards = board.columnCounts.some((c) => c.count > 0);
  const links = [
    board.externalUrl ? { href: board.externalUrl, label: 'Visit' } : null,
    board.repoUrl ? { href: board.repoUrl, label: 'Source' } : null,
    featured && hasCards ? { href: `/projects/${board.id}`, label: 'Board', internal: true } : null,
  ].filter((l): l is { href: string; label: string; internal?: boolean } => l !== null);

  return (
    <article className={`product-card${featured ? ' product-card-featured' : ''}`}>
      {board.imageUrl && <img className="card-image" src={board.imageUrl} alt={`${board.name} screenshot`} />}
      <div className="ticket-row">
        <span className="status-chip">{stageLabel(snapshot.stage, snapshot.progress).toUpperCase()}</span>
        {featured && snapshot.plannedFeatures > 0 && (
          <span className="product-planned">
            {snapshot.plannedFeatures} {snapshot.plannedFeatures === 1 ? 'milestone' : 'milestones'} planned
          </span>
        )}
      </div>
      <h3>{board.name}</h3>
      {board.description && <p>{board.description}</p>}
      <DistBar bands={snapshot.progress} />

      {featured && snapshot.recentMilestones.length > 0 && (
        <div className="milestones">
          <h4>Recently shipped</h4>
          <ul>
            {snapshot.recentMilestones.map((m) => (
              <li key={m.id}>
                <span>{m.title}</span>
                <time dateTime={m.closedAt}>{ago(m.closedAt)}</time>
              </li>
            ))}
          </ul>
        </div>
      )}

      {links.length > 0 && (
        <div className="product-links">
          {links.map((l) =>
            l.internal ? (
              <Link key={l.label} href={l.href} className="view-btn">
                {l.label} →
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="view-btn">
                {l.label} →
              </a>
            )
          )}
        </div>
      )}
    </article>
  );
}
