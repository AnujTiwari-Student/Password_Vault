"use client";

import { X, Plus, Tag } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface TagsInputProps {
  tagInput: string;
  tags: string[];
  onTagInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tagInput,
  tags,
  onTagInputChange,
  onKeyPress,
  onAddTag,
  onRemoveTag,
}) => {
  return (
    <div className="space-y-3">
      <label className="text-gray-700 font-semibold text-sm flex items-center gap-2">
        <Tag className="w-4 h-4 text-gray-400" />
        Tags
      </label>
      
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Add tags (e.g., 'work', 'social')..."
          className="h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm flex-1"
        />
        <Button
          type="button"
          onClick={onAddTag}
          variant="outline"
          size="icon"
          className="h-11 w-11 bg-gray-50 border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 pr-1 pl-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:bg-white hover:text-red-500 rounded-md p-0.5 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {tags.length === 0 && (
        <p className="text-xs text-gray-400 pl-1">
          Press Enter or click + to add a tag
        </p>
      )}
    </div>
  );
};