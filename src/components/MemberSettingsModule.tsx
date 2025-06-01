
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';

export const MemberSettingsModule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Connect your Microsoft 365 account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Microsoft 365 Integration</span>
          </CardTitle>
          <CardDescription>
            Connect your personal Microsoft account to access Outlook, Teams, and SharePoint features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Why connect your Microsoft account?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Access your personal Outlook emails within the platform</li>
                <li>• Join Teams meetings directly from meeting invitations</li>
                <li>• Share and collaborate on documents through SharePoint</li>
                <li>• Sync your calendar for better meeting management</li>
              </ul>
            </div>
            <MicrosoftOAuthButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
