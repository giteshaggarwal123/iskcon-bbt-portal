
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SettingsModule } from './SettingsModule';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = useState(0);
  const isMobile = useIsMobile();

  const handleProfileClick = () => {
    setShowProfile(true);
    setShowSettings(false);
    setCurrentModule('profile');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    setShowProfile(false);
    setCurrentModule('settings');
  };

  const handleModuleChange = (module: string) => {
    setCurrentModule(module);
    setShowProfile(false);
    setShowSettings(false);
    if (isMobile) setSidebarOpen(false);
  };

  const handleNavigateFromNotification = (module: string, id?: string) => {
    setCurrentModule(module);
    setShowProfile(false);
    setShowSettings(false);
    console.log(`Navigating to ${module}${id ? ` with ID: ${id}` : ''}`);
  };

  const renderContent = () => {
    if (showProfile || currentModule === 'profile') {
      return <SettingsModule onAvatarUpdate={() => setAvatarRefreshTrigger(prev => prev + 1)} />;
    }
    if (showSettings || currentModule === 'settings') {
      return <SettingsModule onAvatarUpdate={() => setAvatarRefreshTrigger(prev => prev + 1)} />;
    }
    return children;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
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
        avatarRefreshTrigger={avatarRefreshTrigger}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        !isMobile && sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onNavigate={handleNavigateFromNotification}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
        
        {/* Mobile bottom profile button */}
        {isMobile && (
          <div className="fixed bottom-4 left-4 z-30">
            <button
              onClick={handleProfileClick}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <User className="h-6 w-6 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
