import React from 'react';
import { X } from 'lucide-react';

interface ShareDialogProps {
  shareDialogOpen: boolean;
  setShareDialogOpen: (open: boolean) => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ shareDialogOpen, setShareDialogOpen }) => {
  if (!shareDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share Item</h3>
          <button
            onClick={() => setShareDialogOpen(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Add Users</label>
            <input
              type="email"
              placeholder="Enter email address..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <select className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option>Viewer</option>
              <option>Editor</option>
              <option>Admin</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
            <span className="text-white">Can view password</span>
            <button className="relative w-12 h-6 bg-blue-600 rounded-full transition-colors">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShareDialogOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};