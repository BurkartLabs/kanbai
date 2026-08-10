'use client';

export type ProjectValues = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
};

export function ProjectFields({ values = {} }: { values?: ProjectValues }) {
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
    </div>
  );
}
