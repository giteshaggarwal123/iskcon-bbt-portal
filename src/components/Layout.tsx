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
      {/* Mobile status bar area - Only covers actual notch */}
      {isMobile && (
        <div 
          className="fixed top-0 left-0 right-0 z-[60]" 
          style={{
            height: 'env(safe-area-inset-top, 0px)',
            background: '#B8555A',
            minHeight: '0px'
          }} 
        />
      )}

      {/* Mobile sidebar overlay - Lower z-index than header */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[45]"
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
          isMobile ? 'p-4 pb-28 pt-4' : 'p-4 lg:p-6'
        } ${!isMobile && sidebarOpen && !sidebarCollapsed ? 'pr-4 lg:pr-6' : 'px-4 lg:px-6'}`}>
          <div className="w-full max-w-none">
            {renderContent()}
          </div>
        </main>
        
        {/* Enhanced Mobile Bottom Navigation Bar - More web app like */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[40] safe-area-bottom">
            <div className="flex items-center justify-around px-2 py-2 max-w-full">
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
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-3 transition-all duration-200 min-h-[56px] rounded-xl mx-1 ${
                    currentModule === item.id
                      ? 'text-primary bg-primary/10 shadow-sm'
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

      <style>{`
        /* Enhanced mobile styles for web app-like experience */
        @media (max-width: 767px) {
          /* Root layout improvements with minimal status bar */
          .min-h-screen {
            min-height: 100vh;
            min-height: 100dvh;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }

          /* Body styling - only set background color for notch */
          body {
            background-color: #B8555A;
          }

          /* Root app container with proper offset */
          #root {
            background-color: #f8fafc;
            min-height: 100vh;
            min-height: 100dvh;
            padding-top: env(safe-area-inset-top, 0px);
          }

          /* Enhanced header styling - Fixed z-index and positioning */
          header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 50;
          }

          /* Main content improvements */
          main {
            padding: 1rem;
            padding-bottom: 7rem;
            padding-top: 1rem;
            background: transparent;
            min-height: calc(100vh - 64px - env(safe-area-inset-top, 0) - 80px);
            padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0));
          }

          /* Enhanced bottom navigation with safe area support */
          .fixed.bottom-0 {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            height: auto;
            min-height: 72px;
          }

          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 1rem);
          }

          /* Navigation button enhancements */
          .fixed.bottom-0 button {
            border-radius: 12px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            min-height: 56px;
            position: relative;
            overflow: hidden;
          }

          .fixed.bottom-0 button:active {
            transform: scale(0.95);
          }

          .fixed.bottom-0 button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: currentColor;
            opacity: 0;
            transition: opacity 0.2s ease;
            border-radius: inherit;
          }

          .fixed.bottom-0 button:active::before {
            opacity: 0.1;
          }

          /* Icon and text spacing */
          .fixed.bottom-0 button .h-5 {
            margin-bottom: 0.25rem;
            transition: transform 0.2s ease;
          }

          .fixed.bottom-0 button[class*="text-primary"] .h-5 {
            transform: scale(1.1);
          }

          /* Card improvements for mobile */
          main .bg-card,
          main .bg-white {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 16px;
          }

          /* Text improvements */
          main h1 {
            font-size: 1.75rem;
            font-weight: 700;
            line-height: 1.3;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }

          main h2 {
            font-size: 1.375rem;
            font-weight: 600;
            line-height: 1.3;
            color: #334155;
          }

          main p {
            line-height: 1.5;
            color: #64748b;
          }

          /* Button improvements */
          main button {
            border-radius: 10px;
            font-weight: 500;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          main button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }

          /* Grid and spacing improvements */
          main .grid {
            gap: 1rem;
          }

          main .space-y-4 > * + * {
            margin-top: 1rem;
          }

          main .space-y-6 > * + * {
            margin-top: 1.5rem;
          }

          /* Form elements */
          main input,
          main select,
          main textarea {
            border-radius: 10px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            padding: 0.75rem;
          }

          main input:focus,
          main select:focus,
          main textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          /* Status indicators */
          .bg-green-100 {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
          }

          .bg-red-100 {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
          }

          .bg-blue-100 {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
          }

          .bg-purple-100 {
            background: rgba(147, 51, 234, 0.1);
            border: 1px solid rgba(147, 51, 234, 0.2);
          }

          /* Smooth scrolling */
          main {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }

          /* Hide scrollbars but keep functionality */
          main::-webkit-scrollbar {
            display: none;
          }

          main {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          /* Touch feedback improvements */
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }

          input, textarea, [contenteditable] {
            -webkit-user-select: text;
            user-select: text;
          }

          /* Loading states */
          .animate-spin {
            border-color: #e5e7eb;
            border-top-color: #3b82f6;
          }

          /* Enhanced animations */
          .transition-all {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Accessibility improvements */
          button:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          /* Modal and overlay improvements */
          .bg-black.bg-opacity-50 {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
          }

          /* Fix potential layout shifts */
          .flex-1 {
            min-height: calc(100vh - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0));
          }
        }

        /* Desktop styles remain clean and unchanged */
        @media (min-width: 768px) {
          main {
            background: transparent;
            padding-bottom: 1rem;
          }

          .flex-1 {
            min-width: 0;
            width: 100%;
          }

          main, .flex-1 {
            transition: all 0.3s ease-in-out;
          }

          .bg-card,
          .bg-white {
            background: white;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  );
};
