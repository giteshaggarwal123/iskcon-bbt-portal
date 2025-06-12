
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      {/* Mobile Header with proper safe area */}
      {isMobile && (
        <div className="safe-area-top">
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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
        </div>
      )}

      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex">
          <Sidebar 
            isOpen={true} 
            onClose={() => {}}
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
            isCollapsed={false}
          />
          
          <div className="flex-1 flex flex-col">
            <Header 
              onMenuClick={() => {}}
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
              showMenuButton={false}
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
          
          <main className="flex-1 p-3 pb-20 overflow-y-auto mobile-main">
            <div className="w-full">
              {renderContent()}
            </div>
          </main>
          
          {/* Enhanced Mobile Bottom Navigation with safe area */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex items-center justify-around px-2 py-2">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all duration-200 min-h-[56px] rounded-lg mx-1 ${
                    currentModule === item.id
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
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
        </>
      )}

      <style>{`
        /* Safe area handling for modern mobile devices */
        .safe-area-container {
          height: 100vh;
          height: 100dvh; /* Dynamic viewport height for better mobile support */
        }
        
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
          background: white;
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        /* Mobile-specific viewport fixes */
        @media (max-width: 767px) {
          /* Prevent content from going above notch/camera */
          .safe-area-container {
            padding-top: env(safe-area-inset-top, 0);
            min-height: 100vh;
            min-height: 100svh; /* Small viewport height */
          }
          
          /* Main content area adjustments */
          .mobile-main {
            margin-top: 0;
            padding-top: 0;
            height: calc(100vh - env(safe-area-inset-top, 0) - 140px);
            height: calc(100dvh - env(safe-area-inset-top, 0) - 140px);
            overflow-y: auto;
          }
          
          /* Header positioning */
          header {
            position: relative;
            z-index: 30;
            width: 100%;
          }
          
          /* Better touch targets */
          button {
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Smooth animations */
          button:active {
            transform: scale(0.96);
            transition: transform 0.1s ease;
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
          
          /* iOS specific fixes */
          @supports (-webkit-touch-callout: none) {
            .safe-area-container {
              height: -webkit-fill-available;
            }
          }
          
          /* Android specific fixes */
          @media screen and (max-height: 700px) {
            .mobile-main {
              height: calc(100vh - 120px);
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
