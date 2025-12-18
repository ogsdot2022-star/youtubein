import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => {
  const [visible, setVisible] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  useEffect(() => {
    // Sync initial state if needed
    setTempKey(apiKey);
  }, [apiKey]);

  const handleBlur = () => {
    setApiKey(tempKey);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Key size={18} />
      </div>
      <input
        type={visible ? "text" : "password"}
        className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm transition-all"
        placeholder="Enter YouTube Data API Key (v3)"
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
          * Required to fetch data
        </p>
      )}
    </div>
  );
};