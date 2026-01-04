import React from 'react';
import { Activity, ChevronDown, Check, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button'; 

interface UserData {
  name: string | null;
  email: string | null;
}

interface TopNavProps {
  user: UserData;
  orgs: string[];
  currentOrg: string;
  setCurrentOrg: (org: string) => void;
  handleLogout: () => void;
  isPending: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  user,
  orgs,
  currentOrg,
  setCurrentOrg,
  handleLogout,
  isPending,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = React.useState(false);

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {userMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-white font-medium">{user.name || 'User'}</p>
                  <p className="text-gray-400 text-sm">{user.email || 'N/A'}</p>
                </div>
                <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                  <Settings size={16} />
                  Settings
                </button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isPending}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg justify-start"
                >
                  <LogOut size={16} />
                  {isPending ? 'Logging out...' : 'Sign Out'}
                </Button>
              </div>
            )}
          </div>

          {/* Org Switcher */}
          <div className="relative">
            <button
              onClick={() => setOrgMenuOpen(!orgMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-white font-medium">{currentOrg}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {orgMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {orgs.map(org => (
                  <button
                    key={org}
                    onClick={() => {
                      setCurrentOrg(org);
                      setOrgMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center justify-between first:rounded-t-lg last:rounded-b-lg"
                  >
                    {org}
                    {currentOrg === org && <Check size={16} className="text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Activity size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </nav>
  );
};