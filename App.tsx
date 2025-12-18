import React, { useState, useMemo } from 'react';
import { Search, Loader2, Filter, TrendingUp, AlertCircle, MonitorPlay, Hash } from 'lucide-react';
import { ApiKeyInput } from './components/ApiKeyInput';
import { VideoCard } from './components/VideoCard';
import { YouTubeVideo, SearchFilters, FetchProgress, SortOption } from './types';
import { DEFAULT_FILTERS, SORT_LABELS } from './constants';
import { fetchYouTubeData, resolveChannelId } from './services/youtubeService';

type SearchMode = 'keyword' | 'channel';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.VIEWS);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [targetChannel, setTargetChannel] = useState<{title: string, thumbnail: string} | null>(null);

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setVideos([]);
    setTargetChannel(null);
    if (mode === 'channel') {
        // When analyzing a channel, "Most Views" is the best default to see what "exploded"
        setFilters(f => ({ ...f, order: 'viewCount', channelId: undefined }));
        setSortBy(SortOption.VIEWS);
    } else {
        setFilters(f => ({ ...f, order: 'relevance', channelId: undefined }));
        setSortBy(SortOption.VIEWS);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    if (!apiKey) {
      setError("먼저 YouTube API 키를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setVideos([]);
    setTargetChannel(null);
    setProgress({ current: 0, total: 0, status: '분석 초기화 중...' });

    try {
      let activeFilters = { ...filters };
      let finalQuery = query;

      // Logic for Channel Analysis
      if (searchMode === 'channel') {
        setProgress({ current: 0, total: 0, status: `채널 '${query}' 정보 찾는 중...` });
        const channelInfo = await resolveChannelId(apiKey, query);
        
        if (!channelInfo) {
            throw new Error(`'${query}' 채널을 찾을 수 없습니다. 정확한 채널명이나 핸들을 입력해주세요.`);
        }

        setTargetChannel({ title: channelInfo.title, thumbnail: channelInfo.thumbnail });
        activeFilters.channelId = channelInfo.id;
        finalQuery = ""; // Clear query to fetch ALL videos from this channel, sorted by viewCount
      }

      await fetchYouTubeData(apiKey, finalQuery, activeFilters, (p) => {
        let statusMsg = p.status;
        if (p.status.includes('Fetching page')) statusMsg = `데이터 수집 중 (${p.current}개 완료)...`;
        if (p.status.includes('video stats')) statusMsg = '영상 지표 분석 중...';
        if (p.status.includes('channel stats')) statusMsg = '채널 데이터 분석 중...';
        if (p.status.includes('Finalizing')) statusMsg = '최종 바이럴 점수 계산 중...';
        
        setProgress({ ...p, status: statusMsg });
      }).then(results => {
          setVideos(results);
      });

    } catch (err: any) {
      setError(err.message || "예기치 않은 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      switch (sortBy) {
        case SortOption.VIEWS:
          return b.viewCount - a.viewCount;
        case SortOption.SUBSCRIBERS:
          return (b.subscriberCount || 0) - (a.subscriberCount || 0);
        case SortOption.VIRAL_SCORE:
          return b.viralScore - a.viralScore;
        case SortOption.DATE:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        default:
          return 0;
      }
    });
  }, [videos, sortBy]);

  const handleDateChange = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    setFilters({ ...filters, publishedAfter: days === 0 ? '' : date.toISOString() });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                <TrendingUp className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  유튜브 인사이트 프로
                </h1>
                <p className="text-[10px] text-slate-500 tracking-wider font-medium">VER 3.0 // 딥 서치 & 심층 분석</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-xl mx-4">
              {/* Search Mode Toggle */}
              <div className="flex gap-2 mb-2">
                 <button 
                    onClick={() => handleModeChange('keyword')}
                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors ${searchMode === 'keyword' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                    <Hash size={12} /> 키워드 검색
                 </button>
                 <button 
                    onClick={() => handleModeChange('channel')}
                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors ${searchMode === 'channel' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                    <MonitorPlay size={12} /> 채널 분석
                 </button>
              </div>

              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {searchMode === 'channel' ? (
                      <MonitorPlay className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  ) : (
                      <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  )}
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchMode === 'channel' ? "분석할 채널명 또는 핸들 입력 (예: MrBeast)..." : "주제, 경쟁 채널, 또는 틈새 시장 키워드 분석..."}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-24 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <div className="absolute right-1.5 top-1.5 flex gap-1">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${showFilters ? 'text-blue-400 bg-slate-700' : 'text-slate-400'}`}
                    >
                        <Filter size={18} />
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : '검색'}
                    </button>
                </div>
              </form>
            </div>

            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">정렬 기준 (API 요청)</label>
                  <select
                    value={filters.order}
                    onChange={(e) => setFilters({ ...filters, order: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="relevance">관련성</option>
                    <option value="date">업로드 날짜</option>
                    <option value="viewCount">조회수</option>
                    <option value="rating">평점</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">영상 길이</label>
                  <select
                    value={filters.videoDuration}
                    onChange={(e) => setFilters({ ...filters, videoDuration: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="any">모든 길이</option>
                    <option value="short">짧은 영상 (&lt; 4분)</option>
                    <option value="medium">중간 영상 (4-20분)</option>
                    <option value="long">긴 영상 (&gt; 20분)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">업로드 기간</label>
                  <select
                    onChange={(e) => handleDateChange(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
                    defaultValue={0}
                  >
                    <option value={0}>전체 기간</option>
                    <option value={7}>최근 7일</option>
                    <option value={30}>최근 30일</option>
                    <option value={365}>최근 1년</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading / Progress State */}
        {loading && progress && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="relative w-20 h-20">
                 <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <div className="text-center">
                 <h3 className="text-xl font-semibold text-slate-100">{progress.status}</h3>
                 <p className="text-slate-400 mt-1">
                    {progress.current} / {progress.total} 처리 완료
                 </p>
             </div>
          </div>
        )}

        {/* Error State */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8">
                <AlertCircle />
                <p>{error}</p>
            </div>
        )}

        {/* Results */}
        {!loading && videos.length > 0 && (
            <>
                {/* Stats Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6">
                    <div>
                        {targetChannel ? (
                            <div className="flex items-center gap-3">
                                <img src={targetChannel.thumbnail} alt={targetChannel.title} className="w-12 h-12 rounded-full border border-slate-700" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{targetChannel.title} 심층 분석</h2>
                                    <p className="text-slate-400 text-sm">가장 성과가 좋은 영상 {videos.length}개 발견</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold text-white">검색 결과: "{query}"</h2>
                                <p className="text-slate-400 text-sm">딥 서치로 발견된 영상 {videos.length}개</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
                        {Object.keys(SORT_LABELS).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSortBy(key as SortOption)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    sortBy === key 
                                    ? 'bg-slate-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {SORT_LABELS[key as keyof typeof SORT_LABELS]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedVideos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            </>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-50">
                {searchMode === 'channel' ? <MonitorPlay size={64} className="mb-4" strokeWidth={1} /> : <Search size={64} className="mb-4" strokeWidth={1} />}
                <p className="text-xl">
                    {searchMode === 'channel' 
                        ? "채널명을 입력하여 어떤 영상으로 '떡상'했는지 확인해보세요" 
                        : "주제나 키워드를 입력하여 심층 분석을 시작하세요"}
                </p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;