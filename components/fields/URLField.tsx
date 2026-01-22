import React from 'react';
import { Globe, Copy, Check, ExternalLink } from 'lucide-react';

interface URLFieldProps {
  url?: string;
  onCopy: (value: string) => void;
  copied: boolean;
}

export const URLField: React.FC<URLFieldProps> = ({ url, onCopy, copied }) => {
  if (!url) return null;

  return (
    <div className="group space-y-2">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1 select-none">
        <Globe className="w-3.5 h-3.5 text-gray-400" />
        Website Address
      </label>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1 group/input">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-blue-600 font-medium truncate hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all duration-200 pr-10"
            title="Open website"
          >
            {url}
          </a>
          <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover/input:text-blue-500 transition-colors" />
        </div>

        <button
          onClick={() => onCopy(url)}
          className={`
            shrink-0 p-3 rounded-xl border transition-all duration-200 shadow-sm
            ${copied 
              ? 'bg-green-50 border-green-200 text-green-600' 
              : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md active:scale-95'
            }
          `}
          title="Copy URL"
          type="button"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};