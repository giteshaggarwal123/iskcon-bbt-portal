
import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { RealAuthPage } from '@/components/RealAuthPage';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <RealAuthPage />;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
