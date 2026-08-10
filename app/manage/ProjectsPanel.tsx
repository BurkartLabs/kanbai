'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createProjectAction, deleteProjectAction, updateProjectAction } from './actions';
import { ActionForm, DangerButton, Submit } from './ui';
import { ProjectFields } from './ProjectFields';
import { Dialog } from './Dialog';

export type ProjectRow = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  status: 'in-progress' | 'completed';
  cardCount: number;
};

export function ProjectsPanel({ projects }: { projects: ProjectRow[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const editing = projects.find((p) => p.id === editingId) ?? null;

  return (
    <section className="manage-section">
      <div className="manage-section-head">
        <h2>Projects</h2>
        <button type="button" className="manage-linkbtn" onClick={() => setCreating(true)}>
          + New project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="manage-sub">No projects yet.</p>
      ) : (
        <ul className="manage-list">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                className="manage-row manage-row-button"
                onClick={() => setEditingId(project.id)}
              >
                <span className="manage-row-main">
                  <span className="manage-row-name">{project.name}</span>
                  {project.description && (
                    <span className="manage-row-desc">{project.description}</span>
                  )}
                </span>
                <span className="manage-row-actions">
                  <span className="manage-row-count">
                    {project.cardCount} {project.cardCount === 1 ? 'card' : 'cards'}
                  </span>
                  <span className={`manage-badge manage-badge-${project.status}`}>
                    {project.status === 'completed' ? 'Completed' : 'In progress'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="New project">
        <ActionForm
          action={createProjectAction}
          className="manage-form"
          resetOnSuccess
          onSuccess={() => setCreating(false)}
        >
          <ProjectFields />
          <div className="manage-dialog-foot">
            <button type="button" className="manage-logout" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <Submit label="Create project" pendingLabel="Creating…" />
          </div>
        </ActionForm>
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditingId(null)} title="Edit project">
        {editing && (
          <>
            <ActionForm
              action={updateProjectAction}
              className="manage-form"
              onSuccess={() => setEditingId(null)}
            >
              <input type="hidden" name="projectId" value={editing.id} />
              <ProjectFields
                values={{
                  name: editing.name,
                  description: editing.description,
                  imageUrl: editing.imageUrl,
                  externalUrl: editing.externalUrl,
                }}
                key={editing.id}
              />
              <div className="manage-dialog-foot">
                <Link href={`/manage/projects/${editing.id}`} className="manage-logout">
                  Edit Cards
                </Link>
                <Submit label="Save changes" />
              </div>
            </ActionForm>

            <form action={deleteProjectAction} className="manage-dialog-danger">
              <input type="hidden" name="projectId" value={editing.id} />
              <DangerButton
                label="Delete project"
                confirm={`Delete "${editing.name}" and all of its cards? This cannot be undone.`}
              />
            </form>
          </>
        )}
      </Dialog>
    </section>
  );
}
