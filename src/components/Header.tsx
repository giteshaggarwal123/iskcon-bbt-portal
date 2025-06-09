
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
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onProfileClick, 
  onSettingsClick,
  onNavigate 
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
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {!isMobile && (
              <h1 className="text-xl font-semibold text-gray-900">
                ISKCON Bureau Portal
              </h1>
            )}
            {isMobile && (
              <h1 className="text-lg font-semibold text-gray-900">
                ISKCON Bureau Portal
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications - Dynamic count only shows when there are unread notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
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

        {/* Mobile-specific styles to fix layout */}
        <style>{`
          @media (max-width: 767px) {
            /* Ensure proper mobile header spacing */
            header {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            
            /* Fix header text overflow on mobile */
            header h1 {
              font-size: 1rem;
              line-height: 1.25;
              max-width: calc(100vw - 8rem);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            /* Ensure buttons don't get too small */
            header button {
              min-width: 2.5rem;
              min-height: 2.5rem;
            }
            
            /* Fix header container to prevent stretching */
            header > div {
              max-width: 100%;
              overflow: hidden;
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
