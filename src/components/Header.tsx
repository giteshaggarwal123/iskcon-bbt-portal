
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, MessageSquare, Settings, LogOut, User, Menu } from 'lucide-react';
import { NotificationsDialog } from './NotificationsDialog';
import { MessagesDialog } from './MessagesDialog';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Mock data for unread counts
  const unreadNotifications = 3;
  const unreadMessages = 2;

  useEffect(() => {
    if (user) {
      fetchUserAvatar();
    }
  }, [user]);

  useEffect(() => {
    // Listen for avatar updates
    const handleAvatarUpdate = (event: CustomEvent) => {
      setAvatarUrl(event.detail);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, []);

  const fetchUserAvatar = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        // Get the public URL for the avatar
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.avatar_url);
        setAvatarUrl(publicUrl);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handleGlobalSearchShortcut = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowGlobalSearch(true);
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleGlobalSearchShortcut);
    return () => document.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, []);

  // Get user initials for fallback
  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3">
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
            <h1 className="text-xl font-semibold text-gray-900">ISKCON Bureau Management</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGlobalSearch(true)}
              className="min-w-[200px] justify-start text-muted-foreground"
            >
              <Search className="h-4 w-4 mr-2" />
              Search everything...
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Button>

            {/* Messages */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMessages(true)}
              className="relative"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadMessages > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadMessages}
                </Badge>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-white text-sm font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dialogs */}
      <NotificationsDialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications} 
      />
      <MessagesDialog 
        open={showMessages} 
        onOpenChange={setShowMessages} 
      />
      <GlobalSearch 
        open={showGlobalSearch} 
        onOpenChange={setShowGlobalSearch} 
      />
    </>
  );
};
