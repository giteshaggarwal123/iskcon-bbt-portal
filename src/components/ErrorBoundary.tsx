
import React, { Component, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if error is related to authentication or not found
    const isAuthError = error.message.includes('401') || 
                       error.message.includes('403') || 
                       error.message.includes('token') ||
                       error.message.includes('unauthorized') ||
                       error.message.includes('not found') ||
                       window.location.pathname.includes('404');

    if (isAuthError && this.state.retryCount < this.maxRetries) {
      console.log('Auth-related error detected, attempting auto-refresh...');
      this.handleAutoRefresh();
    }
  }

  handleAutoRefresh = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      console.log(`Auto-refresh attempt ${this.state.retryCount + 1}/${this.maxRetries}`);
      
      // Force token refresh and page reload
      window.location.reload();
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    }, 2000); // 2 second delay before refresh
  };

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Issue Detected
              </h2>
              <p className="text-gray-600 mb-4">
                {this.state.retryCount < this.maxRetries 
                  ? 'Automatically refreshing your session...'
                  : 'We encountered an authentication issue. Please try refreshing the page.'
                }
              </p>
              
              {this.state.retryCount < this.maxRetries && (
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-gray-500">
                    Attempt {this.state.retryCount + 1} of {this.maxRetries}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={this.handleManualRetry}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Now
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              If this issue persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
};
