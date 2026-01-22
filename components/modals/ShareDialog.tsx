import React, { useState } from 'react';
import { X, UserPlus, Shield, ChevronDown, Users, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ShareDialogProps {
  shareDialogOpen: boolean;
  setShareDialogOpen: (open: boolean) => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ shareDialogOpen, setShareDialogOpen }) => {
  const [role, setRole] = useState('Viewer');
  const [canViewPassword, setCanViewPassword] = useState(false);

  if (!shareDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200 m-4">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Share Item</h3>
              <p className="text-xs text-gray-500 font-medium">Manage access permissions</p>
            </div>
          </div>
          <button
            onClick={() => setShareDialogOpen(false)}
            className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
              Add People
            </label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                placeholder="Enter email address..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
              Permission Level
            </label>
            <div className="relative group">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 appearance-none focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm cursor-pointer"
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Permissions Toggle */}
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-100/50 transition-all"
            onClick={() => setCanViewPassword(!canViewPassword)}
          >
            <div className="space-y-0.5">
              <span className="block text-sm font-semibold text-gray-900">Can view passwords</span>
              <span className="block text-xs text-gray-500">Allow user to reveal hidden fields</span>
            </div>
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${canViewPassword ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <div 
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${canViewPassword ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShareDialogOpen(false)}
            className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-10 rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
          >
            Share Item
          </Button>
        </div>
      </div>
    </div>
  );
};