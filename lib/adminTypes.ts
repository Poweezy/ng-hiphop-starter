export interface SongSummary {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  cover_url: string;
  is_active: boolean;
  distribution_links: any;
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

export interface LyricSummary {
  id: string;
  lyric_text: string;
  correct_artist: string;
  is_active: boolean;
}

export interface CompetitionSummary {
  id: string;
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { lyrics: number; subscribers: number };
}
