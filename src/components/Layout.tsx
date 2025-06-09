
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
    
    // Dispatch custom event for module navigation
    const event = new CustomEvent('navigate-to-module', {
      detail: { module: moduleId }
    });
    window.dispatchEvent(event);
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
        onModuleChange={(module) => {
          setCurrentModule(module);
          setShowProfile(false);
          setShowSettings(false);
          if (isMobile) setSidebarOpen(false);
        }}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        !isMobile && sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
        <main className={`flex-1 p-4 lg:p-6 overflow-y-auto ${
          isMobile ? 'pb-20' : ''
        }`}>
          {renderContent()}
        </main>
        
        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
            <div className="flex items-center justify-around py-2 px-4">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.id)}
                  className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors ${
                    currentModule === item.id
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-700'
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
        /* Mobile-only styles */
        @media (max-width: 767px) {
          .safe-area-pb {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          /* Ensure proper touch targets */
          .mobile-nav-button {
            min-height: 48px;
            min-width: 48px;
          }
          
          /* Better visual feedback for touch */
          .mobile-nav-button:active {
            transform: scale(0.95);
            transition: transform 0.1s ease;
          }
          
          /* Prevent content from going under bottom nav */
          main {
            padding-bottom: 5rem !important;
          }
          
          /* Hide scrollbars but keep functionality */
          main::-webkit-scrollbar {
            display: none;
          }
          
          main {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Responsive content adjustments */
          main * {
            max-width: 100%;
            word-wrap: break-word;
          }
          
          /* Better form inputs on mobile */
          main input,
          main select,
          main textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          /* Improve card layouts for mobile */
          main .grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          /* Better button spacing */
          main button {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Responsive text sizing */
          main h1 {
            font-size: 1.5rem;
            line-height: 1.4;
          }
          
          main h2 {
            font-size: 1.25rem;
            line-height: 1.4;
          }
        }
        
        /* Tablet responsive (768px - 1023px) - Same as desktop */
        @media (min-width: 768px) and (max-width: 1023px) {
          /* Tablet uses same layout as desktop, no bottom nav */
        }
        
        /* Desktop (1024px+) - No changes needed */
        @media (min-width: 1024px) {
          /* Desktop layout remains unchanged */
        }
      `}</style>
    </div>
  );
};
