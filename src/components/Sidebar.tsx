
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Vote, 
  Users, 
  Mail, 
  UserCheck, 
  BarChart3, 
  Settings,
  X
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { canManageMembers, canManageMeetings, canManageDocuments, canViewReports, canManageSettings } = useUserRole();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      show: true
    },
    {
      name: 'Meetings',
      icon: Calendar,
      path: '/meetings',
      show: canManageMeetings,
      badge: 'New'
    },
    {
      name: 'Documents',
      icon: FileText,
      path: '/documents',
      show: canManageDocuments
    },
    {
      name: 'Voting',
      icon: Vote,
      path: '/voting',
      show: true
    },
    {
      name: 'Attendance',
      icon: UserCheck,
      path: '/attendance',
      show: true
    },
    {
      name: 'Email',
      icon: Mail,
      path: '/email',
      show: true
    },
    {
      name: 'Members',
      icon: Users,
      path: '/members',
      show: canManageMembers
    },
    {
      name: 'Reports',
      icon: BarChart3,
      path: '/reports',
      show: canViewReports
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      show: true // Always show settings - useUserRole hook will handle what's shown inside
    }
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:inset-0"
      )}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ISKCON Bureau</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.filter(item => item.show).map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    // Close sidebar on mobile when item is clicked
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
