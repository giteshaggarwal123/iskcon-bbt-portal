
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User } from 'lucide-react';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { AvatarUpload } from './AvatarUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const MemberSettingsModule: React.FC = () => {
  const { user } = useAuth();
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserAvatar();
    }
  }, [user]);

  const fetchUserAvatar = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.avatar_url);
        setCurrentAvatarUrl(publicUrl);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    setCurrentAvatarUrl(url);
    // Trigger a refresh of the header avatar
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: url }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and Microsoft 365 connection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Picture</span>
          </CardTitle>
          <CardDescription>
            Upload and manage your profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AvatarUpload 
            currentAvatarUrl={currentAvatarUrl}
            onAvatarUpdate={handleAvatarUpdate}
          />
        </CardContent>
      </Card>

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
