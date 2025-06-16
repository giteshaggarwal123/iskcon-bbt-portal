
import React, { useState, useEffect } from 'react';
import { User, Calendar, File, Users, Settings, Mail, Clock, Check, Home, UserCheck, Vote } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SettingsModule } from './SettingsModule';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
}

export const MobileResponsiveLayout: React.FC<MobileResponsiveLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();

  // Enhanced mobile navigation items with better touch targets
  const mobileNavItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'meetings', icon: Calendar, label: 'Meeting' },
    { id: 'documents', icon: File, label: 'Docs' },
    { id: 'attendance', icon: UserCheck, label: 'Attendance' },
    { id: 'voting', icon: Vote, label: 'Voting' }
  ];

  // Set initial sidebar state based on device
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setSidebarCollapsed(false);
    } else {
      setSidebarOpen(true);
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  const handleMobileNavigation = (moduleId: string) => {
    setCurrentModule(moduleId);
    setShowProfile(false);
    setShowSettings(false);
    setSidebarOpen(false);
    
    const event = new CustomEvent('navigate-to-module', {
      detail: { module: moduleId }
    });
    window.dispatchEvent(event);
  };

  const handleMenuClick = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full safe-area-container">
      {/* Mobile Header */}
      {isMobile && (
        <Header 
          onMenuClick={handleMenuClick}
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
      )}

      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentModule={currentModule}
            onModuleChange={(module) => {
              setCurrentModule(module);
              setShowProfile(false);
              setShowSettings(false);
              
              const event = new CustomEvent('navigate-to-module', {
                detail: { module }
              });
              window.dispatchEvent(event);
            }}
            isCollapsed={sidebarCollapsed}
          />
          
          <div className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen && !sidebarCollapsed ? 'ml-64' : 
            sidebarOpen && sidebarCollapsed ? 'ml-20' : 'ml-0'
          }`}>
            <Header 
              onMenuClick={handleMenuClick}
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
            
            <main className="flex-1 p-4 lg:p-6">
              <div className="w-full max-w-none">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Mobile Content */}
      {isMobile && (
        <>
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
            onModuleChange={(module) => {
              setCurrentModule(module);
              setShowProfile(false);
              setShowSettings(false);
              setSidebarOpen(false);
              
              const event = new CustomEvent('navigate-to-module', {
                detail: { module }
              });
              window.dispatchEvent(event);
            }}
            isCollapsed={false}
          />
          
          <main className="flex-1 px-4 pt-6 pb-24 overflow-y-auto mobile-main">
            <div className="w-full">
              {renderContent()}
            </div>
          </main>
          
          {/* Enhanced Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom shadow-lg">
            <div className="flex items-center justify-center px-3 py-3">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-3 px-2 transition-all duration-200 rounded-lg mx-1 ${
                    currentModule === item.id
                      ? 'text-primary bg-primary/10 scale-105'
                      : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <item.icon className={`h-6 w-6 mb-1.5 ${
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
        </>
      )}

      <style>{`
        /* Safe area handling for modern mobile devices */
        .safe-area-container {
          height: 100vh;
          height: 100dvh; /* Dynamic viewport height for better mobile support */
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 8px);
        }
        
        /* Mobile-specific viewport fixes */
        @media (max-width: 767px) {
          /* Prevent content from going above notch/camera but minimize spacing */
          .safe-area-container {
            padding-top: max(env(safe-area-inset-top, 0), 0px);
            min-height: 100vh;
            min-height: 100svh; /* Small viewport height */
          }
          
          /* Main content area adjustments - improved spacing */
          .mobile-main {
            margin-top: 0;
            padding-top: 1.5rem;
            height: calc(100vh - 160px);
            height: calc(100dvh - 160px);
            overflow-y: auto;
          }
          
          /* Header positioning - minimize top padding */
          header {
            position: relative;
            z-index: 30;
            width: 100%;
            padding-top: max(env(safe-area-inset-top, 0), 8px);
          }
          
          /* Better touch targets */
          button {
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Smooth animations for mobile nav */
          .mobile-nav-button {
            transition: all 0.2s ease-in-out;
          }
          
          .mobile-nav-button:active {
            transform: scale(0.95);
          }
          
          /* Prevent text selection on UI elements */
          * {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
          
          input, textarea, [contenteditable] {
            -webkit-user-select: text;
            user-select: text;
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          /* Hide scrollbars but keep functionality */
          .mobile-main::-webkit-scrollbar {
            display: none;
          }
          
          .mobile-main {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Enhanced bottom navigation styling */
          .fixed.bottom-0 {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          /* iOS specific fixes */
          @supports (-webkit-touch-callout: none) {
            .safe-area-container {
              height: -webkit-fill-available;
            }
            
            /* More precise safe area handling for iOS */
            header {
              padding-top: max(env(safe-area-inset-top, 0), 4px);
            }
            
            .safe-area-bottom {
              padding-bottom: max(env(safe-area-inset-bottom, 0), 12px);
            }
          }
          
          /* Android specific fixes */
          @media screen and (max-height: 700px) {
            .mobile-main {
              height: calc(100vh - 140px);
            }
          }
          
          /* Devices with notch/dynamic island */
          @supports (padding: max(0px)) {
            header {
              padding-top: max(env(safe-area-inset-top, 0), 4px);
            }
          }
        }
        
        /* Desktop remains unchanged */
        @media (min-width: 768px) {
          .safe-area-container {
            height: 100vh;
          }
        }
      `}</style>
    </div>
  );
};
