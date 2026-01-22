'use client';
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Edit2 } from 'lucide-react';

interface ItemActionsProps {
  isDeleting: boolean;
  isEditing: boolean;
  isPending: boolean;
  isCurrentlyDecrypting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

export const ItemActions: React.FC<ItemActionsProps> = ({
  isDeleting,
  isEditing,
  isPending,
  isCurrentlyDecrypting,
  onDelete,
  onEdit,
}) => {
  const isDisabled = isDeleting || isEditing || isPending || isCurrentlyDecrypting;

  // console.log(onEdit);

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 mt-6 bg-white">
      <Button
        onClick={onDelete}
        disabled={isDisabled}
        variant="outline"
        className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 transition-all h-11 px-5 font-medium shadow-sm w-full sm:w-auto"
      >
        {isDeleting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </>
        )}
      </Button>
      
      <Button
        onClick={onEdit}
        disabled={isDisabled}
        className="bg-blue-600 hover:bg-blue-700 text-white transition-all h-11 px-6 font-medium shadow-blue-200 hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
      >
        {isEditing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </>
        )}
      </Button>
    </div>
  );
};