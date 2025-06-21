
import React from 'react';

export const LoadingFallback = () => {
  console.log('LoadingFallback - Rendering loading screen');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-white to-secondary/50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ISKCON BUREAU</h1>
        <p className="text-gray-600 mb-4">Management Portal</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Loading your portal...</p>
      </div>
    </div>
  );
};
