
import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MicrosoftConnectionTimeoutProps {
  onRetry: () => void;
  onCancel: () => void;
}

export const MicrosoftConnectionTimeout: React.FC<MicrosoftConnectionTimeoutProps> = ({
  onRetry,
  onCancel
}) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-1">Connection Taking Too Long</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Microsoft authentication is taking longer than expected ({countdown}s remaining).
            This might be due to popup blockers or network issues.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Try Again
            </Button>
            <Button
              onClick={onCancel}
              size="sm"
              variant="ghost"
              className="text-yellow-700 hover:bg-yellow-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
