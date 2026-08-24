export interface SongSummary {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  cover_url: string;
  is_active: boolean;
  distribution_links: string | null;
  publisher_link?: string | null;
}

export interface QuoteSummary {
  id: string;
  quote_text: string;
  submitted_by: string;
  approved: boolean;
  is_featured: boolean;
  display_until: string | null;
  createdAt: string;
}

export interface GraffitiSummary {
  id: string;
  image_url: string;
  artist_name: string;
  approved: boolean;
  display_until: string | null;
  createdAt: string;
}

export interface CompetitionSummary {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  slug?: string | null;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  bannerUrl?: string | null;
  shortDescription?: string | null;
  socialSharingText?: string | null;
  viewCount: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { subscribers: number; submissions: number };
}

export interface CompetitionRuleSummary {
  id: string;
  competitionId: string;
  minLength?: number | null;
  maxLength?: number | null;
  originalityRequired: boolean;
  copyrightRequirements?: string | null;
  maxSubmissionsPerUser: number;
  eligibilityRequirements?: string | null;
  ageRestriction?: string | null;
  moderationRequired: boolean;
}

export interface CompetitionPrizeSummary {
  id: string;
  competitionId: string;
  position: number;
  name: string;
  cashAmount?: number | null;
  description?: string | null;
}

export interface LyricSubmissionSummary {
  id: string;
  competitionId: string;
  artistAlias: string;
  userId?: string | null;
  lyrics: string;
  songTitle?: string | null;
  audioUrl?: string | null;
  socialLinks?: string | null;
  status: string;
  moderationStatus: string;
  moderationNotes?: string | null;
  moderationReason?: string | null;
  score?: number | null;
  copyrightAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WinnerSummary {
  id: string;
  competitionId: string;
  prizeId?: string | null;
  submissionId: string;
  position: number;
  prizeName?: string | null;
  cashAmount?: number | null;
  winningDate: string;
  selectedBy?: string | null;
  announcementStatus: string;
  createdAt: string;
  submission?: {
    artistAlias: string;
    lyrics: string;
    songTitle?: string | null;
  };
}

export interface SubscriberSummary {
  id: string;
  email: string;
  name?: string | null;
  competitionId: string;
  source: string;
  consentStatus: string;
  consentTimestamp: string;
  subscriptionStatus: string;
  unsubscribedAt?: string | null;
  lastEmailSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  competition?: {
    title: string;
  };
}

export interface EmailCampaignSummary {
  id: string;
  name: string;
  subject: string;
  body: string;
  recipientFilter?: string | null;
  recipientIds?: string | null;
  sentAt?: string | null;
  scheduledAt?: string | null;
  status: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionAnalyticsSummary {
  id: string;
  competitionId: string;
  views: number;
  totalSubmissions: number;
  uniqueParticipants: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  subscribersGenerated: number;
  conversionRate?: number | null;
  winners: number;
  prizeValue?: number | null;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
}
