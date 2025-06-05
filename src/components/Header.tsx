
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
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
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { getUnreadCount } = useNotifications();

  const unreadNotifications = getUnreadCount();

  const handleNotificationNavigation = (module: string, id?: string) => {
    setShowNotifications(false);
    if (onNavigate) {
      onNavigate(module, id);
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
              <h1 className="text-xl font-semibold text-gray-900">ISKCON Bureau Management</h1>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>

            {/* User Profile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onProfileClick}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
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
