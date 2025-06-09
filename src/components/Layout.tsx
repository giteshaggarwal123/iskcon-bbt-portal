
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
  const isMobile = useIsMobile();

  const handleProfileClick = () => {
    setShowProfile(true);
    setCurrentModule('profile');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    setCurrentModule('settings');
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

  return (
    <div className="min-h-screen bg-gray-50 flex mobile-layout">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentModule={currentModule}
        onModuleChange={(module) => {
          setCurrentModule(module);
          setShowProfile(false);
          setShowSettings(false);
          if (isMobile) setSidebarOpen(false);
        }}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 mobile-content ${
        !isMobile && sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto mobile-main">
          {renderContent()}
        </main>
        
        {/* Mobile bottom profile button */}
        {isMobile && (
          <div className="fixed bottom-4 left-4 z-30 mobile-profile-btn">
            <button
              onClick={handleProfileClick}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <User className="h-6 w-6 text-white" />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          .mobile-layout {
            position: relative;
            overflow-x: hidden;
          }
          
          .mobile-overlay {
            backdrop-filter: blur(2px);
          }
          
          .mobile-content {
            width: 100%;
            margin-left: 0 !important;
            min-height: 100vh;
          }
          
          .mobile-main {
            padding: 0.75rem;
            padding-bottom: 5rem;
            overflow-x: hidden;
            width: 100%;
            max-width: 100vw;
          }
          
          .mobile-profile-btn {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          /* Ensure content doesn't overflow horizontally */
          .mobile-main * {
            max-width: 100%;
            word-wrap: break-word;
          }
          
          /* Improve touch targets for mobile */
          .mobile-main button,
          .mobile-main a {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Better spacing for mobile cards and components */
          .mobile-main .grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          /* Responsive text sizing */
          .mobile-main h1 {
            font-size: 1.5rem;
            line-height: 1.4;
          }
          
          .mobile-main h2 {
            font-size: 1.25rem;
            line-height: 1.4;
          }
          
          /* Better form inputs on mobile */
          .mobile-main input,
          .mobile-main select,
          .mobile-main textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
};
