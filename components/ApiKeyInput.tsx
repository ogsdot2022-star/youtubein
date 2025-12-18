import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, HelpCircle, X, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => {
  const [visible, setVisible] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  const handleBlur = () => {
    setApiKey(tempKey);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Key size={18} />
        </div>
        <input
          type={visible ? "text" : "password"}
          className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm transition-all"
          placeholder="YouTube Data API Key (v3) 입력"
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
          onBlur={handleBlur}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {!apiKey && (
          <p className="absolute -bottom-6 left-1 text-[10px] text-amber-500">
            * 데이터 수집을 위해 API 키가 필요합니다.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center justify-center p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-400/50 transition-all shrink-0"
        title="API 키 발급 방법 보기"
      >
        <HelpCircle size={20} />
      </button>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="text-blue-500" size={20} />
                YouTube API 키 발급 가이드
              </h3>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">1</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">Google Cloud 콘솔 접속</p>
                    <p>아래 링크를 눌러 구글 클라우드 콘솔로 이동하세요.</p>
                    <a 
                      href="https://console.cloud.google.com/" 
                      target="_blank" 
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                    >
                      console.cloud.google.com <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">2</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">새 프로젝트 생성</p>
                    <p>상단 프로젝트 선택 메뉴에서 '새 프로젝트'를 만드세요 (이미 있다면 기존 프로젝트 선택).</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">3</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">YouTube Data API v3 활성화</p>
                    <p>'API 및 서비스 > 라이브러리'로 이동하여 <strong>'YouTube Data API v3'</strong>를 검색한 후 <strong>'사용'</strong> 버튼을 누르세요.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">4</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">API 키 생성</p>
                    <p>'사용자 인증 정보' 탭 클릭 → '+ 사용자 인증 정보 만들기' → <strong>'API 키'</strong>를 선택하세요.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">5</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">키 입력</p>
                    <p>생성된 긴 문자열(API 키)을 복사하여 이 앱의 입력창에 붙여넣으면 완료됩니다!</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200 leading-relaxed">
                <strong>💡 팁:</strong> 무료 할당량은 하루에 약 10,000 유닛입니다. 일반적인 사용에는 충분하지만, 대량 검색 시 할당량이 소진될 수 있습니다.
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};