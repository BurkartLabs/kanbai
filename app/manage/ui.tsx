'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from './actions';

export const emptyState: FormState = { error: null };

export function Submit({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="manage-submit" disabled={pending}>
      {pending ? (pendingLabel ?? 'Saving…') : label}
    </button>
  );
}

export function DangerButton({ label, confirm }: { label: string; confirm: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="manage-danger"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? '…' : label}
    </button>
  );
}

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, emptyState);
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error === null) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
  }, [state, resetOnSuccess, onSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && (
        <p className="manage-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function Disclosure({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="manage-linkbtn" onClick={() => setOpen((v) => !v)}>
        {open ? 'Cancel' : summary}
      </button>
      {open && <div className="manage-disclosure">{children}</div>}
    </>
  );
}
