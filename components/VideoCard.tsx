import React, { useState } from 'react';
import { YouTubeVideo } from '../types';
import { VIRAL_THRESHOLD } from '../constants';
import { Play, Users, Eye, Flame, Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface VideoCardProps {
  video: YouTubeVideo;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isViral = video.viralScore >= VIRAL_THRESHOLD;
  const formattedViews = new Intl.NumberFormat('ko-KR', { notation: "compact", maximumFractionDigits: 1 }).format(video.viewCount);
  const formattedSubs = video.subscriberCount 
    ? new Intl.NumberFormat('ko-KR', { notation: "compact", maximumFractionDigits: 1 }).format(video.subscriberCount)
    : '비공개';
  
  const formattedDate = new Date(video.publishedAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleAnalyze = async () => {
    if (analysis) {
        setExpanded(!expanded);
        return;
    }

    setAnalyzing(true);
    setExpanded(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
당신은 최고의 유튜브 성장 전략가입니다. 아래 비디오 데이터를 분석하여 인사이트를 제공해주세요.
답변은 반드시 한국어로 작성하며, 마크다운 형식을 사용하여 가독성을 높여주세요.

[비디오 정보]
- 제목: ${video.title}
- 채널명: ${video.channelTitle}
- 조회수: ${video.viewCount.toLocaleString()}회
- 구독자: ${video.subscriberCount?.toLocaleString() || '비공개'}명
- 바이럴 점수: ${video.viralScore}% (조회수/구독자 비율)
- 게시일: ${formattedDate}

[요청 사항]
1. **성과 분석**: 채널 규모 대비 조회수 성과를 평가하고 바이럴 요인을 분석하세요.
2. **타이틀/썸네일 전략**: 클릭률(CTR)을 높인 요소(키워드, 후킹)를 분석하세요.
3. **벤치마킹 포인트**: 비슷한 주제의 영상을 만들 때 참고해야 할 핵심 포인트 3가지를 제안하세요.
4. **후속 콘텐츠 아이디어**: 이 영상과 연관된 후속 콘텐츠 주제를 1개 추천하세요.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        setAnalysis(response.text || "분석 결과를 불러오지 못했습니다.");
    } catch (error) {
        console.error(error);
        setAnalysis("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (Gemini API Key 확인 필요)");
    } finally {
        setAnalyzing(false);
    }
  };

  return (
    <div className={`group relative bg-slate-800 rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${isViral ? 'border-red-500/50 shadow-lg shadow-red-900/20' : 'border-slate-700 hover:border-slate-600'}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Viral Badge */}
        {isViral && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            <Flame size={12} fill="currentColor" />
            <span>{Math.round(video.viralScore)}% VIRAL</span>
          </div>
        )}
        
        {/* Duration/Link Overlay */}
        <a 
          href={video.videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors">
            <Play fill="white" className="text-white" size={24} />
          </div>
        </a>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-tight" title={video.title}>
              {video.title}
            </h3>
        </div>
        
        <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <span className="font-medium text-slate-300 hover:text-blue-400 cursor-pointer">{video.channelTitle}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/50 rounded-lg p-2 mb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
              <Eye size={10} /> 조회수
            </div>
            <span className="text-slate-200 font-mono text-sm">{formattedViews}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
              <Users size={10} /> 구독자
            </div>
            <span className="text-slate-200 font-mono text-sm">{formattedSubs}</span>
          </div>
          <div className="col-span-2 border-t border-slate-700/50 pt-2 mt-1">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                  <Flame size={10} className={isViral ? "text-red-500" : "text-slate-500"} /> 바이럴 점수
                </div>
                <span className={`font-mono text-sm font-bold ${isViral ? 'text-red-400' : 'text-slate-400'}`}>
                  {Math.round(video.viralScore)}%
                </span>
             </div>
             {/* Simple Bar visual for score */}
             <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full ${isViral ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-blue-500'}`} 
                  style={{ width: `${Math.min(video.viralScore / 200, 100)}%` }}
                />
             </div>
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={handleAnalyze}
          disabled={analyzing}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              analysis 
              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {analyzing ? (
              <>
                 <Loader2 size={14} className="animate-spin" />
                 분석 중...
              </>
          ) : analysis ? (
              <>
                 {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 {expanded ? '분석 접기' : '분석 결과 보기'}
              </>
          ) : (
              <>
                 <Bot size={14} />
                 AI 정밀 분석
              </>
          )}
        </button>

        {/* Analysis Result Box */}
        {expanded && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2">
                {analyzing ? (
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-slate-700/50 rounded animate-pulse"></div>
                        <div className="h-3 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed whitespace-pre-line">
                        {analysis}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};