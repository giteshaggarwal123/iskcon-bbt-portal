
import React from 'react';
import { 
  Calendar, 
  File, 
  Users, 
  Settings, 
  Mail, 
  Clock,
  User,
  Check,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Calendar, requiredPermission: null },
  { id: 'meetings', label: 'Meetings', icon: Calendar, requiredPermission: null }, // All users can view meetings
  { id: 'documents', label: 'Documents', icon: File, requiredPermission: null }, // All users can view documents
  { id: 'voting', label: 'Voting', icon: Check, requiredPermission: null },
  { id: 'attendance', label: 'Attendance', icon: Clock, requiredPermission: null }, // All users can view attendance
  { id: 'email', label: 'Email', icon: Mail, requiredPermission: null }, // All users can access email
  { id: 'members', label: 'Members', icon: Users, requiredPermission: null }, // All users can view members
  { id: 'reports', label: 'Reports', icon: BarChart3, requiredPermission: 'canViewReports' },
  { id: 'settings', label: 'Settings', icon: Settings, requiredPermission: null }, // All users can access settings (but content varies by role)
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentModule, onModuleChange }) => {
  const { user } = useAuth();
  const userRole = useUserRole();

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return userRole[item.requiredPermission as keyof typeof userRole];
  });

  // Extract user info from the authenticated user
  const userName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';
  
  const userEmail = user?.email || 'user@iskcon.org';

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/lovable-uploads/7ccf6269-31c1-46b9-bc5c-60b58a22c03e.png" 
                alt="ISKCON Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">ISKCON</h1>
              <p className="text-sm text-gray-500">Bureau Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentModule === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-secondary hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
                {userRole.userRole && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
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
          </div>
        </div>
      </div>
    </div>
  );
};
