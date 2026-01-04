import React from 'react';
import { Tag } from 'lucide-react';

interface TagsDisplayProps {
  tags?: string[];
}

const getTagColor = (tag: string) => {
  const colors = [
    'bg-blue-900/50 text-blue-300 border-blue-700/50',
    'bg-green-900/50 text-green-300 border-green-700/50',
    'bg-purple-900/50 text-purple-300 border-purple-700/50',
    'bg-orange-900/50 text-orange-300 border-orange-700/50',
    'bg-pink-900/50 text-pink-300 border-pink-700/50',
    'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
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
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        <Tag className="w-4 h-4 mr-2" />
        Tags
      </label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border backdrop-blur-sm transition-all hover:scale-105 ${getTagColor(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
