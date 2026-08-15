import { z } from 'zod';

// Quote validation
export const quoteSubmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long').trim(),
  quote: z.string().min(5, 'Quote must be at least 5 characters').max(280, 'Quote too long').trim(),
});

export const quoteUpdateSchema = z.object({
  id: z.string().cuid(),
  approved: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  display_until: z.string().datetime().optional().nullable(),
});

// Graffiti validation
export const graffitiUpdateSchema = z.object({
  id: z.string().cuid(),
  approved: z.boolean().optional(),
  display_until: z.string().datetime().optional().nullable(),
});

// Lyric validation
export const lyricCreateSchema = z.object({
  lyric_text: z.string().min(5).max(300).trim(),
  correct_artist: z.string().min(1).max(80).trim(),
  is_active: z.boolean().optional(),
});

export const lyricUpdateSchema = z.object({
  id: z.string().cuid(),
  lyric_text: z.string().min(5).max(300).trim().optional(),
  correct_artist: z.string().min(1).max(80).trim().optional(),
  is_active: z.boolean().optional(),
});

export const lyricDeleteSchema = z.object({
  id: z.string().cuid(),
});

// Song validation
export const songUpdateSchema = z.object({
  id: z.string().cuid(),
  is_active: z.boolean().optional(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  distribution_links: z.string().optional().nullable(),
  publisher_link: z.string().optional().nullable(),
});

// Slogan validation
export const sloganUpdateSchema = z.object({
  slogan: z.string().min(1).max(200).trim(),
});

// Competition validation
export const competitionCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  period: z.enum(['monthly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  is_active: z.boolean().optional(),
});

export const competitionUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).trim().optional(),
  period: z.enum(['monthly', 'yearly']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
  winnerId: z.string().cuid().optional().nullable(),
});

export const competitionSubscribeSchema = z.object({
  competitionId: z.string().cuid(),
  email: z.string().email(),
});

export const competitionAssignSchema = z.object({
  lyricIds: z.array(z.string().cuid()).min(1, 'Select at least one lyric'),
});

// Admin: patch user role
export const adminUsersPatchSchema = z.object({
  id: z.string().cuid(),
  role: z.enum(['USER', 'ADMIN']),
});

// Admin: declare competition winner
export const winnerSchema = z.object({
  winnerId: z.string().cuid(),
});

// Admin: reset user password (master secret flow)
export const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetSecret: z.string().min(1),
  newPassword: z.string().min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// Admin: change own password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
