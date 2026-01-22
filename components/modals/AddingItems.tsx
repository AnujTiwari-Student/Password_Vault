import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import ItemCreationForm from '../auth/item-creation-form'

interface AddingItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultId: string;
  vaultType: 'personal' | 'org';
  orgId?: string;
  onSuccess?: () => void;
}

function AddingItemsModal({ 
  isOpen, 
  onClose, 
  vaultId, 
  vaultType, 
  orgId,
  onSuccess 
}: AddingItemsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='bg-white border-gray-200 shadow-2xl p-0 gap-0 max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col sm:rounded-2xl'>
        {/* Hidden title for Accessibility (Screen Readers) 
          We hide this visually because ItemCreationForm has its own visible "FormHeader"
        */}
        <DialogTitle className="sr-only">
          Create New {vaultType} Item
        </DialogTitle>

        <div className="flex-1 h-full overflow-hidden flex flex-col bg-white px-6 py-6 sm:px-8">
          <ItemCreationForm 
            vaultId={vaultId}
            vaultType={vaultType}
            orgId={orgId}
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddingItemsModal