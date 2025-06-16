
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { NotificationsDialog } from './NotificationsDialog';
import { PWAInstallButton } from './PWAInstallButton';
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
  console.log('Header rendered - showMenuButton:', showMenuButton, 'onMenuClick:', !!onMenuClick);

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

  // Enhanced menu click handler
  const handleMenuClick = () => {
    console.log('Header: Menu button clicked - onMenuClick available:', !!onMenuClick);
    if (onMenuClick) {
      onMenuClick();
    } else {
      console.warn('Header: No onMenuClick handler provided');
    }
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Hamburger Menu Button - ALWAYS visible when showMenuButton is true */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMenuClick}
              className="hover:bg-gray-100 transition-colors flex-shrink-0 min-w-[40px] min-h-[40px] z-10"
              title={isMobile ? "Open navigation menu" : "Toggle sidebar"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Title */}
          <h1 className={`font-semibold text-gray-900 truncate ${isMobile ? 'text-lg' : 'text-xl'}`}>
            ISKCON Management Portal
          </h1>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Notifications */}
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
