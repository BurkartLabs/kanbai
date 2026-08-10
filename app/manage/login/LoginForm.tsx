'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, type LoginState } from '../actions';

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="manage-submit" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="manage-form">
      <input type="hidden" name="next" value={next} />

      <label className="manage-field">
        <span>Username</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          spellCheck={false}
autoCapitalize="none"
        />
      </label>

      <label className="manage-field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      {state.error && (
        <p className="manage-error" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
