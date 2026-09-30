'use client';

export type ProjectValues = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  repoUrl?: string | null;
  adoSlug?: string | null;
  featured?: boolean;
  sortOrder?: number;
  completed?: boolean;
};

export type TrackerProduct = { slug: string; stage: string };

export function ProjectFields({
  values = {},
  products = [],
}: {
  values?: ProjectValues;
  products?: TrackerProduct[];
}) {
  return (
    <div className="manage-grid">
      <label className="manage-field">
        <span>Name</span>
        <input name="name" type="text" maxLength={255} required defaultValue={values.name ?? ''} />
      </label>

      <label className="manage-field">
        <span>Description</span>
        <textarea name="description" rows={2} maxLength={5000} defaultValue={values.description ?? ''} />
      </label>

      <label className="manage-field">
        <span>Image URL</span>
        <input
          name="imageUrl"
          type="url"
          maxLength={500}
          placeholder="https://…"
          defaultValue={values.imageUrl ?? ''}
        />
      </label>

      <label className="manage-field">
        <span>Project URL</span>
        <input
          name="externalUrl"
          type="url"
          maxLength={500}
          placeholder="https://…"
          defaultValue={values.externalUrl ?? ''}
        />
      </label>

      <label className="manage-field">
        <span>Repository URL</span>
        <input
          name="repoUrl"
          type="url"
          maxLength={500}
          placeholder="https://github.com/…"
          defaultValue={values.repoUrl ?? ''}
        />
      </label>

      <label className="manage-field">
        <span>Tracker product</span>
        <input
          name="adoSlug"
          type="text"
          maxLength={64}
          list="tracker-products"
          pattern="[a-z0-9][a-z0-9-]*"
          placeholder="blank = track cards here only"
          spellCheck={false}
          autoCapitalize="none"
          defaultValue={values.adoSlug ?? ''}
        />
        <small className="manage-hint">
          Progress and recent milestones then come from the tracker. Leave blank for a project tracked with
          cards here, or one with no board at all yet.
        </small>
        {products.length > 0 && (
          <datalist id="tracker-products">
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.stage}
              </option>
            ))}
          </datalist>
        )}
      </label>

      <label className="manage-field manage-field-check">
        <input name="completed" type="checkbox" defaultChecked={values.completed ?? false} />
        <span>Completed: move to Completed, overriding the tracker stage and cards</span>
      </label>

      <div className="manage-grid-2">
        <label className="manage-field manage-field-check">
          <input name="featured" type="checkbox" defaultChecked={values.featured ?? false} />
          <span>Featured: big card with milestones</span>
        </label>
        <label className="manage-field">
          <span>Sort order</span>
          <input name="sortOrder" type="number" step={1} min={-9999} max={9999} defaultValue={values.sortOrder ?? 0} />
        </label>
      </div>
    </div>
  );
}
