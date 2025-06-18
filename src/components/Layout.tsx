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
      {/* Mobile sidebar overlay - Lower z-index than header */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Header - Fixed at top with highest z-index */}
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
      } pt-28`}>        
        <main className={`flex-1 w-full min-w-0 overflow-x-hidden transition-all duration-300 ${
          isMobile ? 'p-4 pb-24 pt-4' : 'p-4 lg:p-6'
        } ${!isMobile && sidebarOpen && !sidebarCollapsed ? 'pr-4 lg:pr-6' : 'px-4 lg:px-6'}`}>
          <div className="w-full max-w-none">
            {renderContent()}
          </div>
        </main>
        
        {/* Structured Mobile Bottom Navigation Bar - Fixed like header */}
        {isMobile && (
          <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 shadow-lg z-50 h-18 rounded-xl">
            <div className="flex items-center justify-around px-2 py-3 h-full max-w-full">
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
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-3 transition-all duration-200 h-full rounded-lg ${
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
                  <span className={`text-xs font-medium leading-tight ${
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
    </div>
  );
};
