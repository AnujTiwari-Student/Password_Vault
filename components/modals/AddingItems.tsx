import React from 'react'
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogContent } from '../ui/dialog'
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
      <DialogContent className='bg-gray-900 border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className='text-white'>Add Items</DialogTitle>
          <DialogDescription className='text-gray-400'>
            Add items to your {vaultType === 'personal' ? 'personal' : 'organization'} vault
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
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
