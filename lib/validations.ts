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
  is_active: z.boolean(),
});

// Slogan validation
export const sloganUpdateSchema = z.object({
  slogan: z.string().min(1).max(200).trim(),
});
