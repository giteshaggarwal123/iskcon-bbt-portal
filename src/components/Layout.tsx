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
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();

  // Listen for navigation events from other components
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

  // Mobile bottom navigation items - Updated to show Home, Meeting, Docs, Attendance, and Voting
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
          
          // Dispatch custom event for module navigation
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
          onMenuClick={toggleSidebar}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onNavigate={handleNavigateFromNotification}
          showMenuButton={true} // Always show menu button for both mobile and desktop
        />
        <main className={`flex-1 w-full min-w-0 overflow-x-hidden transition-all duration-300 ${
          isMobile ? 'p-2 pb-20' : 'p-4 lg:p-6'
        } ${!isMobile && sidebarOpen && !sidebarCollapsed ? 'pr-4 lg:pr-6' : 'px-4 lg:px-6'}`}>
          <div className="w-full max-w-none">
            {renderContent()}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="flex items-center justify-between px-2 py-2 max-w-full overflow-hidden">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                    currentModule === item.id
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mb-1 ${
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
        /* Desktop styles - responsive sidebar handling */
        @media (min-width: 768px) {
          /* Ensure main content uses available width based on sidebar state */
          main {
            width: 100%;
            max-width: 100%;
          }
          
          /* Remove any artificial constraints */
          main > div {
            width: 100%;
            max-width: 100%;
          }
          
          /* Ensure flex containers expand properly */
          .flex-1 {
            min-width: 0;
            width: 100%;
          }

          /* Optimize content width when sidebar is collapsed */
          .sidebar-collapsed main {
            padding-left: 2rem;
            padding-right: 2rem;
          }

          /* Smooth transitions for all layout changes */
          main, .flex-1 {
            transition: all 0.3s ease-in-out;
          }
        }
        
        /* Mobile-only styles */
        @media (max-width: 767px) {
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
            max-width: 100vw;
            overflow-x: hidden;
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
            box-sizing: border-box;
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

          /* Fix container width issues */
          .min-h-screen {
            width: 100vw;
            max-width: 100vw;
            overflow-x: hidden;
          }

          /* Prevent horizontal scroll in bottom navigation */
          .fixed.bottom-0 {
            width: 100vw;
            max-width: 100vw;
            overflow-x: hidden;
          }

          .fixed.bottom-0 .flex {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }
        }
      `}</style>
    </div>
  );
};
