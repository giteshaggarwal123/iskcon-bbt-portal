
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return userRole[item.requiredPermission as keyof typeof userRole];
  });

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
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isMobile ? 'z-50' : 'lg:translate-x-0'}`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className={`border-b border-gray-200 ${isMobile ? 'p-4' : 'p-6'}`}>
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className={`flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
              <img 
                src="/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png" 
                alt="ISKCON Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>ISKCON</h1>
              <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Bureau Management</p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 overflow-y-auto ${isMobile ? 'px-3 py-4' : 'px-4 py-6'}`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center text-sm font-medium rounded-lg transition-colors ${
                isMobile ? 'px-3 py-2' : 'px-4 py-3'
              } ${
                currentModule === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-secondary hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isMobile ? 'mr-2' : 'mr-3'}`} />
              {item.label}
            </button>
          ))}
          
          {/* Logout Button */}
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center justify-start text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors mt-4 ${
                  isMobile ? 'px-3 py-2' : 'px-4 py-3'
                }`}
              >
                <LogOut className={`h-5 w-5 ${isMobile ? 'mr-2' : 'mr-3'}`} />
                Logout
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

        {/* User Profile Section */}
        <div className={`border-t border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
          <button 
            onClick={handleProfileClick}
            className={`w-full flex items-center space-x-3 rounded-lg hover:bg-gray-50 transition-colors ${
              isMobile ? 'p-2' : 'p-3'
            }`}
          >
            <ProfileAvatarLoader 
              userName={userName} 
              refreshTrigger={avatarRefreshTrigger}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className={`font-medium text-gray-900 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {userName}
              </p>
              <div className="flex items-center justify-between">
                <p className={`text-gray-500 truncate ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {userEmail}
                </p>
                {userRole.userRole && (
                  <span className={`px-2 py-1 rounded ml-2 flex-shrink-0 ${
                    isMobile ? 'text-xs' : 'text-xs'
                  } ${
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
