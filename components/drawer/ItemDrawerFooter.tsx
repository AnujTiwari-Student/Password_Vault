import React from 'react';
import { Edit3, X } from 'lucide-react';

interface ItemDrawerFooterProps {
  onClose: () => void;
  onEdit?: () => void;
}

export const ItemDrawerFooter: React.FC<ItemDrawerFooterProps> = ({ onClose, onEdit }) => {
  return (
    <div className="p-4 sm:p-6 border-t border-gray-700/50 bg-gray-850/80 backdrop-blur-sm">
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700/80 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <X className="w-4 h-4" />
          <span className="text-sm sm:text-base">Close</span>
        </button>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/90 backdrop-blur-sm border border-blue-500/50 text-white rounded-xl hover:bg-blue-700/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-sm sm:text-base">Edit</span>
          </button>
        )}
      </div>
    </div>
  );
};
