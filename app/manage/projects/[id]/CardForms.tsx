'use client';

import { createCardAction, deleteCardAction, updateCardAction } from '../../actions';
import { ActionForm, DangerButton, Disclosure, Submit } from '../../ui';

type Card = { id: number; title: string; description: string | null };

export function CardEditor({ card, projectId }: { card: Card; projectId: number }) {
  return (
    <Disclosure summary="Edit">
      <ActionForm action={updateCardAction} className="manage-form">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="cardId" value={card.id} />
        <label className="manage-field">
          <span>Title</span>
          <input name="title" type="text" maxLength={255} required defaultValue={card.title} />
        </label>
        <label className="manage-field">
          <span>Description</span>
          <textarea
            name="description"
            rows={2}
            maxLength={5000}
            defaultValue={card.description ?? ''}
          />
        </label>
        <Submit label="Save" />
      </ActionForm>

      <form action={deleteCardAction} className="manage-delete-form">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="cardId" value={card.id} />
        <DangerButton label="Delete card" confirm={`Delete "${card.title}"?`} />
      </form>
    </Disclosure>
  );
}

export function NewCardForm({ projectId, columnId }: { projectId: number; columnId: number }) {
  return (
    <Disclosure summary="+ Add card">
      <ActionForm action={createCardAction} className="manage-form" resetOnSuccess>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="columnId" value={columnId} />
        <label className="manage-field">
          <span>Title</span>
          <input name="title" type="text" maxLength={255} required />
        </label>
        <label className="manage-field">
          <span>Description</span>
          <textarea name="description" rows={2} maxLength={5000} />
        </label>
        <Submit label="Add card" pendingLabel="Adding…" />
      </ActionForm>
    </Disclosure>
  );
}
