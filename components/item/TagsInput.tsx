"use client";

import { X, Plus } from "lucide-react";
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
      <label className="text-white text-sm">Tags</label>
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Add a tag..."
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 text-sm flex-1"
        />
        <Button
          type="button"
          onClick={onAddTag}
          variant="outline"
          size="icon"
          className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white flex-shrink-0 h-10 w-10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-gray-700 text-gray-200 hover:bg-gray-600 pr-1 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-2 hover:text-red-400 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
