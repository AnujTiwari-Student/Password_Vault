"use client";

import { ITEM_TYPE_CONFIG } from './constants';
import { ItemTypeConfig } from './types';
import { ItemTypeEnum, ITEM_TYPES } from "@/schema/zod-schema";
import { useFormContext } from "react-hook-form";

interface ItemTypeSelectorProps {
  selectedTypes: ItemTypeEnum[];
  onToggleType: (type: ItemTypeEnum) => void;
}

export const ItemTypeSelector: React.FC<ItemTypeSelectorProps> = ({
  selectedTypes,
  onToggleType,
}) => {
  const { formState: { errors } } = useFormContext();

  console.log(errors);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label className="text-white">What do you want to store?</label>
        <p className="text-gray-400 text-sm mt-1">
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
                relative p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01]
                ${
                  isSelected
                    ? `${config.color} border-current`
                    : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center mt-0.5 ${
                    isSelected
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-400 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {config.label}
                  </h3>
                  <p className="text-gray-400 text-xs mb-2">
                    {config.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.examples.map((example, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded"
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
        <p className="text-red-400 text-sm">
          Please select at least one item type
        </p>
      )}
    </div>
  );
};
