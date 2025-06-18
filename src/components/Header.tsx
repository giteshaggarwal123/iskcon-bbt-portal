
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { NotificationsDialog } from './NotificationsDialog';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/useNotifications';

interface HeaderProps {
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onNavigate?: (module: string, id?: string) => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onProfileClick, 
  onSettingsClick,
  onNavigate,
  showMenuButton = true
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { getUnreadCount } = useNotifications();

  const unreadNotifications = getUnreadCount();
  console.log('Header - Unread notifications:', unreadNotifications);

  // Get user's name for personalized greeting
  const userName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Devotee';

  const handleNotificationNavigation = (module: string, id?: string) => {
    setShowNotifications(false);
    if (onNavigate) {
      onNavigate(module, id);
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu Button - Show on both mobile and desktop */}
            {onMenuClick && showMenuButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="hover:bg-gray-100 transition-colors"
                title={isMobile ? "Open navigation menu" : "Toggle sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {!isMobile && (
              <h1 className="text-xl font-semibold text-gray-900">
                ISKCON Management Portal
              </h1>
            )}
            {isMobile && (
              <h1 className="text-lg font-semibold text-gray-900">
                Portal
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications - Simple dot indicator when there are unread notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Dialogs */}
      <NotificationsDialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications}
        onNavigate={handleNotificationNavigation}
      />
    </>
  );
};
