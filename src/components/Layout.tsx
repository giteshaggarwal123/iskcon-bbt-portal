
import React, { useState, useEffect } from 'react';
import { User, Calendar, File, Users, Settings, Mail, Clock, Check, Home, UserCheck, Vote } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SettingsModule } from './SettingsModule';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Listen for navigation events from other components
  useEffect(() => {
    const handleNavigateToModule = (event: any) => {
      setCurrentModule(event.detail.module);
      setShowProfile(false);
      setShowSettings(false);
    };

    window.addEventListener('navigate-to-module', handleNavigateToModule);

    return () => {
      window.removeEventListener('navigate-to-module', handleNavigateToModule);
    };
  }, []);

  const handleProfileClick = () => {
    setShowProfile(true);
    setCurrentModule('profile');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    setCurrentModule('settings');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      // On desktop, toggle between collapsed and expanded
      setSidebarCollapsed(!sidebarCollapsed);
    }
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

  // Enhanced mobile navigation items with better touch targets
  const mobileNavItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'meetings', icon: Calendar, label: 'Meeting' },
    { id: 'documents', icon: File, label: 'Docs' },
    { id: 'attendance', icon: UserCheck, label: 'Attendance' },
    { id: 'voting', icon: Vote, label: 'Voting' }
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

  const handleNavigateFromNotification = (module: string, id?: string) => {
    setCurrentModule(module);
    setShowProfile(false);
    setShowSettings(false);
    
    // Dispatch custom event for module navigation
    const event = new CustomEvent('navigate-to-module', {
      detail: { module }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
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
          
          const event = new CustomEvent('navigate-to-module', {
            detail: { module }
          });
          window.dispatchEvent(event);
        }}
        isCollapsed={!isMobile && sidebarCollapsed}
      />
      
      <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${
        !isMobile && sidebarOpen && !sidebarCollapsed ? 'ml-64' : 
        !isMobile && sidebarOpen && sidebarCollapsed ? 'ml-16' : 'ml-0'
      }`}>
        <Header 
          onMenuClick={() => {
            if (isMobile) {
              setSidebarOpen(!sidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          onProfileClick={() => {
            setShowProfile(true);
            setCurrentModule('profile');
          }}
          onSettingsClick={() => {
            setShowSettings(true);
            setCurrentModule('settings');
          }}
          onNavigate={(module) => {
            setCurrentModule(module);
            setShowProfile(false);
            setShowSettings(false);
            
            const event = new CustomEvent('navigate-to-module', {
              detail: { module }
            });
            window.dispatchEvent(event);
          }}
          showMenuButton={true}
        />
        
        <main className={`flex-1 w-full min-w-0 overflow-x-hidden transition-all duration-300 ${
          isMobile ? 'p-2 pb-20 pt-6' : 'p-4 lg:p-6'
        } ${!isMobile && sidebarOpen && !sidebarCollapsed ? 'pr-4 lg:pr-6' : 'px-4 lg:px-6'}`}>
          <div className="w-full max-w-none">
            {renderContent()}
          </div>
        </main>
        
        {/* Enhanced Mobile Bottom Navigation Bar with better touch targets */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
            <div className="flex items-center justify-between px-1 py-1 max-w-full overflow-hidden">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentModule(item.id);
                    setShowProfile(false);
                    setShowSettings(false);
                    setSidebarOpen(false);
                    
                    const event = new CustomEvent('navigate-to-module', {
                      detail: { module: item.id }
                    });
                    window.dispatchEvent(event);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-3 px-2 transition-all duration-200 min-h-[60px] rounded-lg mx-1 ${
                    currentModule === item.id
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <item.icon className={`h-6 w-6 mb-1 ${
                    currentModule === item.id ? 'text-primary' : 'text-gray-500'
                  }`} />
                  <span className={`text-xs font-medium ${
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
        /* Enhanced mobile styles for better app experience */
        @media (max-width: 767px) {
          /* Better touch targets and spacing */
          .mobile-nav-button {
            min-height: 60px;
            min-width: 60px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Smooth touch feedback */
          .mobile-nav-button:active {
            transform: scale(0.96);
            transition: transform 0.1s ease;
          }
          
          /* Native app feel */
          * {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
          
          input, textarea, [contenteditable] {
            -webkit-user-select: text;
            user-select: text;
          }
          
          /* Clean mobile layout - no footer compensation needed */
          main {
            max-width: 100vw;
            overflow-x: hidden;
            padding-bottom: 80px; /* Only for mobile bottom nav */
          }
          
          /* Safe area support for modern devices */
          .safe-area-inset-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
          
          /* Hide scrollbars but keep functionality */
          main::-webkit-scrollbar {
            display: none;
          }
          
          main {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Better form inputs on mobile */
          main input,
          main select,
          main textarea {
            font-size: 16px; /* Prevents zoom on iOS */
            border-radius: 8px;
          }
          
          /* Improve button accessibility */
          main button {
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
          }
          
          /* Native-like status bar handling */
          .min-h-screen {
            min-height: 100vh;
            min-height: 100dvh;
          }
          
          /* Improved card layouts for mobile */
          main .grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          /* Better typography for mobile */
          main h1 {
            font-size: 1.5rem;
            line-height: 1.4;
          }
          
          main h2 {
            font-size: 1.25rem;
            line-height: 1.4;
          }
        }
        
        /* Desktop optimizations */
        @media (min-width: 768px) {
          main {
            width: 100%;
            max-width: 100%;
            padding-bottom: 1rem; /* Clean bottom padding for desktop */
          }
          
          .flex-1 {
            min-width: 0;
            width: 100%;
          }

          main, .flex-1 {
            transition: all 0.3s ease-in-out;
          }
        }
      `}</style>
    </div>
  );
};
