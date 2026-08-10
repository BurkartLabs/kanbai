import { redirect } from 'next/navigation';
import { adminConfigured } from '@/lib/admin';
import { optionalSession } from '@/lib/dal';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

function safeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith('/manage')) return '/manage';
  if (value.startsWith('//') || value.includes('\\')) return '/manage';
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (await optionalSession()) redirect('/manage');

  const { next } = await searchParams;

  return (
    <div className="manage-auth">
      <div className="manage-card">
        <div className="manage-brand">
          <span className="manage-brand-dot" />
          Kanbai
        </div>
        <h1>Sign in</h1>
        <p className="manage-sub">This area is restricted.</p>

        {adminConfigured() ? (
          <LoginForm next={safeNext(next)} />
        ) : (
          <p className="manage-error" role="alert">
            No admin credentials are configured. Set <code>ADMIN_USERNAME</code> and{' '}
            <code>ADMIN_PASSWORD_HASH</code> in <code>.env.local</code>, then restart the server.
          </p>
        )}
      </div>
    </div>
  );
}
