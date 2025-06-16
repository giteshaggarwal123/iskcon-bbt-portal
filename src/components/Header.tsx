
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

  // Default menu click handler if none provided
  const handleMenuClick = () => {
    console.log('Menu button clicked - onMenuClick:', !!onMenuClick);
    if (onMenuClick) {
      onMenuClick();
    } else {
      console.warn('No onMenuClick handler provided to Header');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 relative z-50 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 flex-1">
            {/* Hamburger Menu Button - ALWAYS show if showMenuButton is true */}
            {showMenuButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMenuClick}
                className="hover:bg-gray-100 transition-colors flex-shrink-0 min-w-[40px] min-h-[40px]"
                title={isMobile ? "Open navigation menu" : "Toggle sidebar"}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            {/* Title */}
            {!isMobile && (
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                ISKCON Management Portal
              </h1>
            )}
            {isMobile && (
              <h1 className="text-lg font-semibold text-gray-900 truncate flex-1">
                ISKCON Management Portal
              </h1>
            )}
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
        </div>

        {/* Enhanced mobile styles */}
        <style>{`
          @media (max-width: 767px) {
            header {
              padding-left: 1rem;
              padding-right: 1rem;
              position: sticky;
              top: 0;
              z-index: 50;
            }
            
            header h1 {
              font-size: 1rem;
              line-height: 1.25;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            header button {
              min-width: 40px;
              min-height: 40px;
            }
            
            header > div {
              max-width: 100%;
              overflow: hidden;
            }
          }

          @media (min-width: 768px) {
            header {
              position: sticky;
              top: 0;
              z-index: 30;
            }
            
            header button[title*="Toggle"] {
              border-radius: 0.375rem;
              transition: all 0.2s ease-in-out;
            }
            
            header button[title*="Toggle"]:hover {
              background-color: rgba(0, 0, 0, 0.05);
              transform: scale(1.05);
            }
          }
        `}</style>
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
