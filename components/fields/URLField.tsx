import React from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface URLFieldProps {
  url?: string;
  onCopy: (value: string) => void;
  copied: boolean;
}

export const URLField: React.FC<URLFieldProps> = ({ url, onCopy, copied }) => {
  if (!url) return null;

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        <ExternalLink className="w-4 h-4 mr-2" />
        URL
      </label>
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-gray-700/80 transition-all duration-200 truncate hover:scale-[1.01] text-sm sm:text-base"
        >
          {url}
        </a>
        <button
          onClick={() => onCopy(url)}
          className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          title="Copy URL"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};
