import { auth } from '@/lib/auth';

export async function requireAdmin() {
  const session = await auth();
  const userRole = session?.user?.role ?? null;

  if (!session || userRole !== 'ADMIN') {
    return { session: null, error: { message: 'Unauthorized', status: 401 } };
  }

  return { session, error: null } as const;
}
