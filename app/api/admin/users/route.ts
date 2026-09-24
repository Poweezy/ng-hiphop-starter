import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { withAdmin } from '@/app/api/_lib/withAdmin';
import { errorResponse, successResponse } from '@/lib/api';
import { adminUsersPatchSchema } from '@/lib/validations';

export const PATCH = withAdmin(async ({ req, session }) => {
    const body = await req.json();
    const parsed = adminUsersPatchSchema.safeParse(body);

    if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.issues);
    }

    const { id, role } = parsed.data;

    if (id === session.user?.id) {
        return errorResponse('Cannot change your own role', 400, 'INVALID_OPERATION');
    }

    const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return successResponse(updated);
});
