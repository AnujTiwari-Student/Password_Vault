import React from 'react';
import { Edit3, X } from 'lucide-react';

interface ItemDrawerFooterProps {
  onClose: () => void;
  onEdit?: () => void;
}

export const ItemDrawerFooter: React.FC<ItemDrawerFooterProps> = ({ onClose, onEdit }) => {
  return (
    <div className="p-4 sm:px-6 sm:py-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-end items-center gap-3 shrink-0">
      <button
        onClick={onClose}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
      >
        <X className="w-4 h-4" />
        <span>Close</span>
      </button>
      
      {onEdit && (
        <button 
          onClick={onEdit}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-gray-800 shadow-sm transition-all hover:shadow-md"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Item</span>
        </button>
      )}
    </div>
  );
};