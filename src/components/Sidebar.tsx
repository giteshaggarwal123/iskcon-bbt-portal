import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  File, 
  Users, 
  Settings, 
  Mail, 
  Clock,
  User,
  Check,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ProfileAvatarLoader } from './ProfileAvatarLoader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: string;
  onModuleChange: (module: string) => void;
  avatarRefreshTrigger?: number;
  isCollapsed?: boolean;
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, requiredPermission: 'canAccessDashboard' },
  { id: 'meetings', label: 'Meetings', icon: Calendar, requiredPermission: 'canAccessMeetings' },
  { id: 'documents', label: 'Documents', icon: File, requiredPermission: 'canAccessDocuments' },
  { id: 'voting', label: 'Voting', icon: Check, requiredPermission: 'canAccessVoting' },
  { id: 'attendance', label: 'Attendance', icon: Clock, requiredPermission: 'canAccessAttendance' },
  { id: 'email', label: 'Email', icon: Mail, requiredPermission: 'canAccessEmail' },
  { id: 'members', label: 'Members', icon: Users, requiredPermission: 'canAccessMembersModule' },
  { id: 'settings', label: 'Settings', icon: Settings, requiredPermission: 'canAccessSettings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  currentModule, 
  onModuleChange, 
  onClose,
  avatarRefreshTrigger = 0,
  isCollapsed = false
}) => {
  const { user, signOut } = useAuth();
  const userRole = useUserRole();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return userRole[item.requiredPermission as keyof typeof userRole];
  });

  // Extract user info with priority: profile > user metadata > email
  const userName = profile 
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email?.split('@')[0] || 'User'
    : user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
      : user?.email?.split('@')[0] || 'User';
  
  const userEmail = profile?.email || user?.email || 'user@iskcon.org';

  const handleItemClick = (itemId: string) => {
    onModuleChange(itemId);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogoutConfirm = async () => {
    await signOut();
    setShowLogoutDialog(false);
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

  const handleLogoClick = () => {
    onModuleChange('dashboard');
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div className={`fixed z-50 bg-white shadow-xl transform transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isMobile ? 'w-64 top-12 bottom-0' : 'top-16 bottom-0 lg:translate-x-0'} ${
      !isMobile && isCollapsed ? 'w-20' : 'w-64'
    } left-0`}>
      <div className="flex flex-col h-full">
        {/* Logo Section - Now Clickable */}
        <div className="p-6 border-b border-gray-200">
          <button 
            onClick={handleLogoClick}
            className={`flex items-center space-x-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors ${
              !isMobile && isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <img 
                src="/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png" 
                alt="ISKCON Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="text-left">
                <h1 className="text-lg font-bold text-gray-900">ISKCON Bureau</h1>
                <p className="text-sm text-gray-500">Portal</p>
              </div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-0 pb-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentModule === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-secondary hover:text-gray-900'
              } ${!isMobile && isCollapsed ? 'justify-center px-2' : ''}`}
              title={!isMobile && isCollapsed ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${(!isCollapsed || isMobile) ? 'mr-3' : ''}`} />
              {(!isCollapsed || isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
          
          {/* Logout Button with Confirmation Dialog */}
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors mt-4 ${
                  !isMobile && isCollapsed ? 'justify-center px-2' : 'justify-start'
                }`}
                title={!isMobile && isCollapsed ? 'Logout' : undefined}
              >
                <LogOut className={`h-5 w-5 flex-shrink-0 ${(!isCollapsed || isMobile) ? 'mr-3' : ''}`} />
                {(!isCollapsed || isMobile) && 'Logout'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out of your account and redirected to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogoutConfirm}>
                  Yes, Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>

        {/* User Profile Section - Removed role badge */}
        {(!isCollapsed || isMobile) && (
          <div className="border-t border-gray-200 p-4">
            <button 
              onClick={handleProfileClick}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ProfileAvatarLoader 
                userName={userName} 
                refreshTrigger={avatarRefreshTrigger + profileRefreshTrigger}
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              </div>
            </button>
          </div>
        )}
        
        {/* Collapsed user profile - just avatar */}
        {!isMobile && isCollapsed && (
          <div className="border-t border-gray-200 p-4 flex justify-center">
            <button 
              onClick={handleProfileClick}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              title={userName}
            >
              <ProfileAvatarLoader 
                userName={userName} 
                refreshTrigger={avatarRefreshTrigger + profileRefreshTrigger}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
