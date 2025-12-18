import { SearchFilters, YouTubeVideo, FetchProgress, YTSearchResponse, YTVideoDetailsResponse, YTChannelDetailsResponse } from '../types';
import { MAX_PAGES_DEEP_SEARCH, MAX_RESULTS_PER_PAGE } from '../constants';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper to find a channel ID by name/handle
export const resolveChannelId = async (apiKey: string, query: string): Promise<{id: string, title: string, thumbnail: string} | null> => {
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', query);
    url.searchParams.append('type', 'channel');
    url.searchParams.append('maxResults', '1');
    url.searchParams.append('key', apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    
    if (data.items && data.items.length > 0) {
        return {
            id: data.items[0].id.channelId,
            title: data.items[0].snippet.title,
            thumbnail: data.items[0].snippet.thumbnails.default?.url
        };
    }
    return null;
}

export const fetchYouTubeData = async (
  apiKey: string,
  query: string,
  filters: SearchFilters,
  onProgress: (progress: FetchProgress) => void
): Promise<YouTubeVideo[]> => {
  if (!apiKey) throw new Error("API Key is required");

  let allVideos: Partial<YouTubeVideo>[] = [];
  let nextPageToken = '';
  let pageCount = 0;

  // 1. Deep Search Loop
  while (pageCount < MAX_PAGES_DEEP_SEARCH) {
    onProgress({
      current: pageCount * MAX_RESULTS_PER_PAGE,
      total: MAX_PAGES_DEEP_SEARCH * MAX_RESULTS_PER_PAGE,
      status: `Fetching page ${pageCount + 1}...`
    });

    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('maxResults', MAX_RESULTS_PER_PAGE.toString());
    // Only append 'q' (query) if we aren't in strict channel mode, or if we want to search keywords WITHIN a channel.
    // However, for "Channel Analysis", usually we want ALL videos. 
    // If channelId is provided, we use the query only if it's not empty, otherwise we don't send 'q' to get all videos.
    if (query) {
        searchUrl.searchParams.append('q', query);
    }
    
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('order', filters.order);
    
    if (filters.videoDuration !== 'any') {
      searchUrl.searchParams.append('videoDuration', filters.videoDuration);
    }
    if (filters.publishedAfter) {
      searchUrl.searchParams.append('publishedAfter', new Date(filters.publishedAfter).toISOString());
    }
    if (filters.channelId) {
      searchUrl.searchParams.append('channelId', filters.channelId);
    }
    if (nextPageToken) {
      searchUrl.searchParams.append('pageToken', nextPageToken);
    }

    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch search results');
    }
    
    const data: YTSearchResponse = await response.json();
    
    if (!data.items || data.items.length === 0) break;

    const pageVideos = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    allVideos = [...allVideos, ...pageVideos];
    nextPageToken = data.nextPageToken || '';
    pageCount++;

    if (!nextPageToken) break;
  }

  // 2. Fetch Video Statistics (Views, Likes)
  onProgress({ current: allVideos.length, total: allVideos.length, status: 'Fetching video stats...' });
  
  // Chunking requests because ID limit is usually 50
  const videoIds = allVideos.map(v => v.id).filter((id): id is string => !!id);
  const videoStatsMap = new Map<string, { viewCount: number; likeCount: number; duration: string }>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const statsUrl = new URL(`${BASE_URL}/videos`);
    statsUrl.searchParams.append('part', 'statistics,contentDetails');
    statsUrl.searchParams.append('id', chunk.join(','));
    statsUrl.searchParams.append('key', apiKey);

    const res = await fetch(statsUrl.toString());
    const data: YTVideoDetailsResponse = await res.json();

    data.items?.forEach(item => {
      videoStatsMap.set(item.id, {
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        likeCount: parseInt(item.statistics.likeCount || '0', 10),
        duration: item.contentDetails.duration
      });
    });
  }

  // 3. Fetch Channel Statistics (Subscribers)
  onProgress({ current: allVideos.length, total: allVideos.length, status: 'Fetching channel stats...' });
  
  const channelIds = Array.from(new Set(allVideos.map(v => v.channelId).filter((id): id is string => !!id)));
  const channelStatsMap = new Map<string, number | null>();

  for (let i = 0; i < channelIds.length; i += 50) {
    const chunk = channelIds.slice(i, i + 50);
    const channelsUrl = new URL(`${BASE_URL}/channels`);
    channelsUrl.searchParams.append('part', 'statistics');
    channelsUrl.searchParams.append('id', chunk.join(','));
    channelsUrl.searchParams.append('key', apiKey);

    const res = await fetch(channelsUrl.toString());
    const data: YTChannelDetailsResponse = await res.json();

    data.items?.forEach(item => {
      const subs = item.statistics.hiddenSubscriberCount 
        ? null 
        : parseInt(item.statistics.subscriberCount || '0', 10);
      channelStatsMap.set(item.id, subs);
    });
  }

  // 4. Merge Data & Calculate Viral Score
  onProgress({ current: allVideos.length, total: allVideos.length, status: 'Finalizing analysis...' });

  const finalVideos: YouTubeVideo[] = allVideos.map(v => {
    const vStats = videoStatsMap.get(v.id!) || { viewCount: 0, likeCount: 0, duration: '' };
    const subs = channelStatsMap.get(v.channelId!) ?? null;
    
    // Viral Score: (Views / Subs) * 100
    // If subs is 0 or null, we cannot calculate accurately, set to 0 to avoid Infinity
    let viralScore = 0;
    if (subs && subs > 0) {
      viralScore = (vStats.viewCount / subs) * 100;
    }

    return {
      id: v.id!,
      title: v.title!,
      thumbnail: v.thumbnail!,
      publishedAt: v.publishedAt!,
      channelId: v.channelId!,
      channelTitle: v.channelTitle!,
      videoUrl: v.videoUrl!,
      viewCount: vStats.viewCount,
      likeCount: vStats.likeCount,
      commentCount: 0, // Not critical for this view
      duration: vStats.duration,
      subscriberCount: subs,
      viralScore: parseFloat(viralScore.toFixed(2))
    };
  });

  return finalVideos;
};