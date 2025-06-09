
import React, { useState } from 'react';
import { User, Calendar, File, Users, Settings, Mail, Clock, Check } from 'lucide-react';
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

  // Mobile bottom navigation items
  const mobileNavItems = [
    { id: 'dashboard', icon: Calendar, label: 'Home' },
    { id: 'meetings', icon: Calendar, label: 'Meetings' },
    { id: 'documents', icon: File, label: 'Docs' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const handleMobileNavigation = (moduleId: string) => {
    setCurrentModule(moduleId);
    setShowProfile(false);
    setShowSettings(false);
    setSidebarOpen(false);
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
        
        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="flex items-center justify-around py-2 px-4">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.id)}
                  className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 ${
                    currentModule === item.id
                      ? 'text-primary'
                      : 'text-gray-500'
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
        )}
      </div>

      <style>{`
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
            display: flex;
            flex-direction: column;
          }
          
          .mobile-main {
            padding: 0.75rem;
            padding-bottom: 5rem;
            overflow-x: hidden;
            width: 100%;
            max-width: 100vw;
            flex: 1;
          }
          
          .mobile-bottom-nav {
            height: 60px;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            background-color: rgba(255, 255, 255, 0.95);
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
            font-size: 16px;
          }
          
          /* Hide scrollbars but keep functionality */
          .mobile-main::-webkit-scrollbar {
            display: none;
          }
          
          .mobile-main {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Improve card layouts for mobile */
          .mobile-main .card,
          .mobile-main [class*="card"] {
            margin-bottom: 1rem;
            border-radius: 12px;
          }
          
          /* Better button spacing */
          .mobile-main .button-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          /* Responsive tables */
          .mobile-main table {
            font-size: 0.875rem;
          }
          
          .mobile-main td,
          .mobile-main th {
            padding: 0.5rem;
          }
        }
        
        /* Tablet responsive (768px - 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .mobile-main {
            padding: 1rem;
          }
          
          .mobile-main .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
