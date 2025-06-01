
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Mail, Calendar, FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SettingsModule: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Profile fetch error:', error);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const isMicrosoftConnected = profile?.microsoft_access_token && profile?.token_expires_at && new Date(profile.token_expires_at) > new Date();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Loading your account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and integration settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email Address</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            
            {profile?.first_name && (
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{profile.first_name} {profile.last_name}</p>
              </div>
            )}
            
            {profile?.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{profile.phone}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Microsoft 365 Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Microsoft 365 Integration</span>
            </CardTitle>
            <CardDescription>
              Connect your Microsoft account to access Outlook, Teams, and SharePoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isMicrosoftConnected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Connected</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium">Not Connected</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Inactive
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {isMicrosoftConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Your Microsoft account is connected and ready to use.
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Outlook Email</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Teams Meetings</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Calendar Events</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>SharePoint Docs</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Token expires: {new Date(profile.token_expires_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect your Microsoft 365 account to unlock:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Send emails through Outlook</li>
                  <li>• Create Teams meetings automatically</li>
                  <li>• Sync calendar events</li>
                  <li>• Access SharePoint documents</li>
                </ul>
                <MicrosoftOAuthButton />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>Account security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Account Created</label>
              <p className="text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Last Sign In</label>
              <p className="text-gray-900">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'First time'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Email Verified</label>
              <div className="flex items-center space-x-2">
                {user?.email_confirmed_at ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-600">Pending</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Application Info</span>
            </CardTitle>
            <CardDescription>Platform version and support information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Platform Version</label>
              <p className="text-gray-900">ISKCON Bureau v1.0</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Support Contact</label>
              <p className="text-gray-900">bureau-support@iskcon.org</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Privacy Policy</label>
              <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                View Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
