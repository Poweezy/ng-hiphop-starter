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

// ============================================
// Best Lyrics Portal — Competition Management
// ============================================

export const competitionCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['monthly', 'yearly', 'custom']).default('monthly'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  slug: z.string().max(200).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  submissionDeadline: z.string().datetime(),
  bannerUrl: z.string().url().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  socialSharingText: z.string().max(280).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const competitionUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['monthly', 'yearly', 'custom']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  slug: z.string().max(200).optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  submissionDeadline: z.string().datetime().optional(),
  bannerUrl: z.string().url().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  socialSharingText: z.string().max(280).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const competitionRuleSchema = z.object({
  competitionId: z.string().cuid(),
  minLength: z.number().int().positive().optional().nullable(),
  maxLength: z.number().int().positive().optional().nullable(),
  originalityRequired: z.boolean().default(true),
  copyrightRequirements: z.string().max(1000).optional().nullable(),
  maxSubmissionsPerUser: z.number().int().positive().default(1),
  eligibilityRequirements: z.string().max(1000).optional().nullable(),
  ageRestriction: z.string().max(50).optional().nullable(),
  moderationRequired: z.boolean().default(true),
});

export const competitionPrizeSchema = z.object({
  competitionId: z.string().cuid(),
  position: z.number().int().positive(),
  name: z.string().min(1).max(200).trim(),
  cashAmount: z.number().nonnegative().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const lyricSubmissionSchema = z.object({
  competitionId: z.string().cuid(),
  artistAlias: z.string().min(1).max(100).trim(),
  lyrics: z.string().min(10).max(5000).trim(),
  songTitle: z.string().max(200).optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
  socialLinks: z.string().max(500).optional().nullable(),
  copyrightAccepted: z.boolean().default(false),
});

export const submissionModerationSchema = z.object({
  submissionId: z.string().cuid(),
  action: z.enum(['approve', 'reject', 'request_changes', 'disqualify']),
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const winnerSelectionSchema = z.object({
  competitionId: z.string().cuid(),
  submissionId: z.string().cuid(),
  position: z.number().int().positive(),
  prizeId: z.string().cuid().optional().nullable(),
});

export const subscriberSchema = z.object({
  competitionId: z.string().cuid(),
  email: z.string().email(),
  name: z.string().max(100).optional().nullable(),
  source: z.string().max(200).default(''),
  consentStatus: z.enum(['granted', 'withdrawn']).default('granted'),
  subscriptionStatus: z.enum(['active', 'unsubscribed', 'bounced']).default('active'),
});

export const emailCampaignSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  subject: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(10000),
  recipientFilter: z.string().max(1000).optional().nullable(),
  recipientIds: z.string().max(10000).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed']).default('draft'),
});

export const competitionSubscribeSchema = z.object({
  competitionId: z.string().cuid(),
  email: z.string().email(),
  name: z.string().max(100).optional().nullable(),
  source: z.string().max(200).default('Best Lyrics Portal'),
  consentStatus: z.enum(['granted', 'withdrawn']).default('granted'),
});

export const competitionAssignSchema = z.object({
  lyricIds: z.array(z.string().cuid()).min(1, 'Select at least one lyric'),
});

// Admin: patch user role
export const adminUsersPatchSchema = z.object({
  id: z.string().cuid(),
  role: z.enum(['USER', 'ADMIN']),
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
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
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
