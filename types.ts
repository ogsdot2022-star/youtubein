export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number | null; // Null if hidden
  viralScore: number;
  duration?: string;
  videoUrl: string;
}

export enum SortOption {
  VIEWS = 'VIEWS',
  SUBSCRIBERS = 'SUBSCRIBERS',
  VIRAL_SCORE = 'VIRAL_SCORE',
  DATE = 'DATE'
}

export interface SearchFilters {
  order: 'relevance' | 'date' | 'viewCount' | 'rating';
  videoDuration: 'any' | 'short' | 'medium' | 'long';
  publishedAfter: string; // ISO 8601 date string
  channelId?: string; // Optional: for channel-specific analysis
}

export interface FetchProgress {
  current: number;
  total: number;
  status: string;
}

// API Response Types (Internal use for service)
export interface YTSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      thumbnails: { high: { url: string }; medium: { url: string } };
      publishedAt: string;
      channelId: string;
      channelTitle: string;
    };
  }>;
  nextPageToken?: string;
}

export interface YTVideoDetailsResponse {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
    contentDetails: {
      duration: string;
    };
  }>;
}

export interface YTChannelDetailsResponse {
  items: Array<{
    id: string;
    statistics: {
      subscriberCount: string;
      hiddenSubscriberCount: boolean;
    };
    snippet?: {
      title: string;
      thumbnails: { default: { url: string } };
    };
  }>;
}