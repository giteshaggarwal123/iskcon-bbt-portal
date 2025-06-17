
import React from 'react';
import { Layout } from './Layout';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
}

export const MobileResponsiveLayout: React.FC<MobileResponsiveLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Layout>{children}</Layout>;
  }

  return <Layout>{children}</Layout>;
};
