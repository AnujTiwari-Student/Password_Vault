"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  itemName: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemName,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white border border-gray-200 text-gray-900 shadow-xl rounded-2xl max-w-112.5 p-6 gap-6">
        
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          
          {/* Warning Icon */}
          <div className="p-3 bg-red-50 rounded-full border border-red-100 shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <div className="space-y-2 flex-1">
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Delete Item?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 leading-relaxed text-sm">
                Are you sure you want to permanently delete <span className="font-bold text-gray-900 break-all">{itemName}</span>?
                <br className="mb-2" />
                <span className="block mt-2 text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md border border-red-100 text-xs">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isDeleting}
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 rounded-xl h-11 px-5 font-medium transition-colors"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 px-5 font-medium shadow-sm hover:shadow-md transition-all border border-red-600"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};