import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role ?? null;

  if (!session || userRole !== 'ADMIN') {
    return { session: null, error: { message: 'Unauthorized', status: 401 } };
  }

  return { session, error: null } as const;
}
