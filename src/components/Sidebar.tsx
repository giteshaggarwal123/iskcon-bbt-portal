
import React, { useState } from 'react';
import { 
  Calendar, 
  File, 
  Users, 
  Settings, 
  Mail, 
  Clock,
  User,
  Check,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileAvatarLoader } from './ProfileAvatarLoader';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: string;
  onModuleChange: (module: string) => void;
  avatarRefreshTrigger?: number; // Add prop to trigger avatar refresh
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Calendar, requiredPermission: null },
  { id: 'meetings', label: 'Meetings', icon: Calendar, requiredPermission: null },
  { id: 'documents', label: 'Documents', icon: File, requiredPermission: null },
  { id: 'voting', label: 'Voting', icon: Check, requiredPermission: null },
  { id: 'attendance', label: 'Attendance', icon: Clock, requiredPermission: null },
  { id: 'email', label: 'Email', icon: Mail, requiredPermission: 'canManageMeetings' },
  { id: 'members', label: 'Members', icon: Users, requiredPermission: null },
  { id: 'settings', label: 'Settings', icon: Settings, requiredPermission: 'canManageSettings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  currentModule, 
  onModuleChange, 
  onClose,
  avatarRefreshTrigger = 0
}) => {
  const { user, signOut } = useAuth();
  const userRole = useUserRole();
  const isMobile = useIsMobile();

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return userRole[item.requiredPermission as keyof typeof userRole];
  });

  // Extract user info from the authenticated user
  const userName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';
  
  const userEmail = user?.email || 'user@iskcon.org';

  const handleItemClick = (itemId: string) => {
    onModuleChange(itemId);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = () => {
    signOut();
    if (isMobile) {
      onClose();
    }
  };

  const handleProfileClick = () => {
    onModuleChange('settings');
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isMobile ? 'z-50' : 'lg:translate-x-0'}`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png" 
                alt="ISKCON Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">ISKCON</h1>
              <p className="text-sm text-gray-500">Bureau Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentModule === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-secondary hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
          
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors mt-4"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-4">
          <button 
            onClick={handleProfileClick}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ProfileAvatarLoader 
              userName={userName} 
              refreshTrigger={avatarRefreshTrigger}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
                {userRole.userRole && (
                  <span className={`text-xs px-2 py-1 rounded ml-2 flex-shrink-0 ${
                    userRole.isSuperAdmin ? 'bg-red-100 text-red-700' :
                    userRole.isAdmin ? 'bg-blue-100 text-blue-700' :
                    userRole.isSecretary ? 'bg-green-100 text-green-700' :
                    userRole.isTreasurer ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {userRole.userRole.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
