import { verifySession } from '@/lib/dal';
import { getBoardSummaries } from '@/lib/projects';
import { adoConfigured, getProducts } from '@/lib/ado';
import { logout } from './actions';
import { ProjectsPanel, type ProjectRow } from './ProjectsPanel';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const session = await verifySession();
  const [boards, trackerProducts] = await Promise.all([getBoardSummaries(), getProducts()]);

  const projects: ProjectRow[] = boards.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    imageUrl: b.imageUrl,
    externalUrl: b.externalUrl,
    repoUrl: b.repoUrl,
    adoSlug: b.adoSlug,
    featured: b.featured,
    sortOrder: b.sortOrder,
    completed: b.markedComplete,
    status: b.status,
    cardCount: b.columnCounts.reduce((n, c) => n + c.count, 0),
  }));

  const totalCards = projects.reduce((sum, p) => sum + p.cardCount, 0);

  return (
    <div className="manage-shell">
      <header className="manage-topbar">
        <div>
          <div className="manage-brand">
            <span className="manage-brand-dot" />
            Kanbai admin
          </div>
          <p className="manage-sub">
            Signed in as <strong>{session.username}</strong>
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="manage-logout">
            Sign out
          </button>
        </form>
      </header>

      <div className="manage-stats">
        <div className="manage-stat">
          <span className="manage-stat-label">Projects</span>
          <span className="manage-stat-value">{projects.length}</span>
        </div>
        <div className="manage-stat">
          <span className="manage-stat-label">Tracker</span>
          <span className="manage-stat-value manage-stat-small">{adoConfigured() ? `${trackerProducts.length} products` : 'not configured'}</span>
        </div>
        <div className="manage-stat">
          <span className="manage-stat-label">Cards</span>
          <span className="manage-stat-value">{totalCards}</span>
        </div>
        <div className="manage-stat">
          <span className="manage-stat-label">Completed</span>
          <span className="manage-stat-value">
            {projects.filter((p) => p.status === 'completed').length}
          </span>
        </div>
      </div>

      <ProjectsPanel projects={projects} products={trackerProducts.map((p) => ({ slug: p.slug, stage: p.stage }))} />
    </div>
  );
}
