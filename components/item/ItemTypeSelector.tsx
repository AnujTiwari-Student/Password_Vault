"use client";

import { ITEM_TYPE_CONFIG } from './constants';
import { ItemTypeConfig } from './types';
import { ItemTypeEnum, ITEM_TYPES } from "@/schema/zod-schema";
import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

interface ItemTypeSelectorProps {
  selectedTypes: ItemTypeEnum[];
  onToggleType: (type: ItemTypeEnum) => void;
}

export const ItemTypeSelector: React.FC<ItemTypeSelectorProps> = ({
  selectedTypes,
  onToggleType,
}) => {
  // We keep this hook usage to ensure re-renders on form state changes if needed
  // even if we don't explicitly use errors here (managed by parent or passed down)
  const { formState: { errors } } = useFormContext();

  // Debug log preserved from original
  console.log(errors);

  return (
    <div className="space-y-4">
      <div className="px-1">
        <label className="text-gray-900 font-bold text-base block mb-1">
          What do you want to store?
        </label>
        <p className="text-gray-500 text-sm">
          Select one or more types - you can combine them freely
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ITEM_TYPES.map((type) => {
          const config = ITEM_TYPE_CONFIG[type] as ItemTypeConfig;
          const Icon = config.icon;
          const isSelected = selectedTypes.includes(type);

          return (
            <div
              key={type}
              onClick={() => onToggleType(type)}
              className={`
                group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 
                ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-200 ring-1 ring-blue-100 shadow-sm"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div
                  className={`
                    w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-colors border
                    ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300 group-hover:border-blue-400"
                    }
                  `}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white stroke-3" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-blue-700" : "text-gray-500 group-hover:text-blue-600"}`} />
                    <h3 className={`font-bold text-sm ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                      {config.label}
                    </h3>
                  </div>
                  
                  <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                    {config.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {config.examples.map((example, idx) => (
                      <span
                        key={idx}
                        className={`
                          text-[10px] px-2 py-1 rounded-md font-medium border
                          ${isSelected 
                            ? "bg-white/60 text-blue-700 border-blue-100" 
                            : "bg-gray-50 text-gray-600 border-gray-100 group-hover:bg-blue-50/30"}
                        `}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTypes.length === 0 && (
        <p className="text-red-500 text-sm font-medium px-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Please select at least one item type
        </p>
      )}
    </div>
  );
};