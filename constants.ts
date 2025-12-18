export const MAX_RESULTS_PER_PAGE = 50;
export const MAX_PAGES_DEEP_SEARCH = 4; // 50 * 4 = 200 videos
export const VIRAL_THRESHOLD = 10000; // 10000% viral score for the badge

export const DEFAULT_FILTERS = {
  order: 'relevance',
  videoDuration: 'any',
  publishedAfter: '', // Empty means anytime
};

export const SORT_LABELS = {
  VIEWS: '최다 조회수',
  SUBSCRIBERS: '최다 구독자',
  VIRAL_SCORE: '바이럴 점수',
  DATE: '최신순'
};