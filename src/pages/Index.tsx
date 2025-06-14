
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to root path to be handled by AppContent
  return <Navigate to="/" replace />;
};

export default Index;
