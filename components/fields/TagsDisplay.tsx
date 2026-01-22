import React from 'react';
import { Tag } from 'lucide-react';

interface TagsDisplayProps {
  tags?: string[];
}

const getTagColor = (tag: string) => {
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  ];
  
  const hash = tag.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="group space-y-2.5">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1 select-none">
        <Tag className="w-3.5 h-3.5 text-gray-400" />
        Tags
      </label>
      
      <div className="flex flex-wrap gap-2 p-1">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`
              px-3 py-1 text-xs font-semibold rounded-lg border shadow-sm transition-all duration-200 
              cursor-default hover:shadow-md select-none
              ${getTagColor(tag)}
            `}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};