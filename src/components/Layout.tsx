
import React, { useState, useEffect } from 'react';
import { User, Calendar, File, Users, Settings, Mail, Clock, Check, Home, UserCheck, Vote } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('Layout - Current location:', location.pathname);

  // Update current module based on location
  useEffect(() => {
    const path = location.pathname;
    let module = 'dashboard';
    
    if (path === '/') {
      module = 'dashboard';
    } else if (path.startsWith('/')) {
      module = path.substring(1);
    }
    
    console.log('Layout - Location changed to:', path, 'Module:', module);
    setCurrentModule(module);
  }, [location]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const handleModuleChange = (module: string) => {
    console.log('Layout - Module changed to:', module);
    setCurrentModule(module);
    if (isMobile) setSidebarOpen(false);
    
    const routePath = module === 'dashboard' ? '/' : `/${module}`;
    console.log('Layout - Navigating to:', routePath);
    
    try {
      navigate(routePath);
    } catch (error) {
      console.error('Layout - Navigation error:', error);
      window.location.href = routePath;
    }
  };

  // Enhanced mobile navigation items with better touch targets
  const mobileNavItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'meetings', icon: Calendar, label: 'Meeting' },
    { id: 'documents', icon: File, label: 'Docs' },
    { id: 'attendance', icon: UserCheck, label: 'Attendance' },
    { id: 'voting', icon: Vote, label: 'Voting' }
  ];

  return (
    <div className="min-h-screen flex w-full overflow-hidden" style={{ backgroundColor: '#FCFAF5' }}>
      {/* Mobile sidebar overlay with blur effect - Lower z-index than sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Header - Higher z-index on mobile */}
      <Header 
        onMenuClick={() => {
          if (isMobile) {
            setSidebarOpen(!sidebarOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        onProfileClick={() => handleModuleChange('settings')}
        onSettingsClick={() => handleModuleChange('settings')}
        onNavigate={handleModuleChange}
        showMenuButton={true}
      />
      
      {/* Sidebar - Highest z-index on mobile, normal on desktop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
        isCollapsed={!isMobile && sidebarCollapsed}
      />
      
      {/* Main content area - Properly aligned with sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${
        isMobile ? 'ml-0' : 
        (!isMobile && sidebarOpen && !sidebarCollapsed) ? 'ml-64' : 
        (!isMobile && sidebarOpen && sidebarCollapsed) ? 'ml-16' : 'ml-0'
      } ${isMobile ? 'pt-28' : 'pt-16'}`}>        
        <main className={`flex-1 w-full min-w-0 overflow-x-hidden transition-all duration-300 ${
          isMobile ? 'p-4 pb-32 pt-4' : 'p-6'
        }`}>
          <div className="w-full max-w-none mx-auto">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation Bar - Lower z-index than sidebar */}
        {isMobile && (
          <div className="bg-white border-t border-gray-200 px-2 py-2 fixed bottom-2 left-0 right-0 z-30 h-20 mx-2 rounded-lg shadow-lg">
            <div className="flex items-center justify-around h-full max-w-full">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleModuleChange(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors duration-200 h-full ${
                    currentModule === item.id
                      ? 'text-primary'
                      : 'text-black hover:text-gray-700'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <item.icon className={`h-8 w-8 mb-1 ${
                    currentModule === item.id ? 'text-primary' : 'text-black'
                  }`} />
                  <span className={`text-xs font-medium leading-tight ${
                    currentModule === item.id ? 'text-primary' : 'text-black'
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
