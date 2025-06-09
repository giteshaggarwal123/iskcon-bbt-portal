
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
  Home
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SettingsModule } from './SettingsModule';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface LayoutProps {
  children: React.ReactNode;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

const mobileMenuItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'voting', label: 'Voting', icon: Check },
  { id: 'documents', label: 'Files', icon: File },
  { id: 'members', label: 'Members', icon: Users },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentModule, onModuleChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();
  const userRole = useUserRole();

  const handleProfileClick = () => {
    setShowProfile(true);
    onModuleChange('profile');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    onModuleChange('settings');
  };

  const handleModuleChange = (module: string) => {
    onModuleChange(module);
    setShowProfile(false);
    setShowSettings(false);
    if (isMobile) setSidebarOpen(false);
  };

  const renderContent = () => {
    if (showProfile || currentModule === 'profile') {
      return <SettingsModule />;
    }
    if (showSettings || currentModule === 'settings') {
      return <SettingsModule />;
    }
    return children;
  };

  // Filter mobile menu items based on user permissions
  const filteredMobileItems = mobileMenuItems.filter(item => {
    // Add permission logic here if needed
    return true;
  });

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
        
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentModule={currentModule}
          onModuleChange={handleModuleChange}
        />
        
        {/* Main Content with mobile padding */}
        <main className="flex-1 pb-20 overflow-y-auto">
          <div className="w-full min-h-full">
            {renderContent()}
          </div>
        </main>
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb">
          <div className="flex justify-around items-center py-2 px-2">
            {filteredMobileItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleModuleChange(item.id)}
                className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 rounded-lg transition-colors ${
                  currentModule === item.id
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`h-5 w-5 mb-1 ${
                  currentModule === item.id ? 'text-primary' : 'text-gray-500'
                }`} />
                <span className={`text-xs font-medium truncate ${
                  currentModule === item.id ? 'text-primary' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Tablet Layout - Restored proper sidebar layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Tablet sidebar overlay */}
      {!isMobile && sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
      />
      
      {/* Main content area with proper sidebar spacing */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
