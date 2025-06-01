
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, MessageSquare, Settings, LogOut, User } from 'lucide-react';
import { NotificationsDialog } from './NotificationsDialog';
import { MessagesDialog } from './MessagesDialog';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '@/hooks/useAuth';

export const Header: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { user, signOut } = useAuth();

  // Mock data for unread counts
  const unreadNotifications = 3;
  const unreadMessages = 2;

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

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon">
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
