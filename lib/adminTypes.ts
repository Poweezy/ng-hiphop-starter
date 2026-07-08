export interface SongSummary {
  id: string;
  title: string;
  is_active: boolean;
}

export interface QuoteSummary {
  id: string;
  approved: boolean;
  is_featured: boolean;
}

export interface GraffitiSummary {
  id: string;
  approved: boolean;
}

export interface LyricSummary {
  id: string;
  is_active: boolean;
}
