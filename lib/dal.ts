import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession, type Session } from './session';

export const verifySession = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session) redirect('/manage/login');
  return session;
});

export const optionalSession = cache(async (): Promise<Session | null> => getSession());
