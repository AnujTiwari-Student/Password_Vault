import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from 'lucide-react';

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
  const isDisabled = isDeleting || isPending || isCurrentlyDecrypting;

  console.log(isEditing, onEdit)

  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-4">
      <Button
        onClick={onDelete}
        disabled={isDisabled}
        variant="outline"
        className="bg-transparent hover:bg-red-600/10 text-red-400 border-red-600/50 hover:border-red-600 transition-colors h-10 px-4"
      >
        {isDeleting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            Delete
          </>
        )}
      </Button>
      
      {/* <Button
        onClick={onEdit}
        disabled={isDisabled}
        className="bg-blue-600 hover:bg-blue-700 text-white transition-colors h-10 px-4"
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
      </Button> */}
    </div>
  );
};