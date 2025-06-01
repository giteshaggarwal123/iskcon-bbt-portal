
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, LogOut, User, Mail, Shield } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        console.log('No user found, skipping profile fetch');
        setLoading(false);
        return;
      }
      
      console.log('Fetching profile for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Profile Error",
            description: "Could not load profile data",
            variant: "destructive"
          });
        } else {
          console.log('Profile data loaded:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('Profile fetch exception:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleLogout = async () => {
    console.log('Logout initiated');
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasMicrosoftConnection = profile?.microsoft_access_token && profile?.token_expires_at;
  const isTokenValid = hasMicrosoftConnection && new Date(profile.token_expires_at) > new Date();

  console.log('Microsoft connection status:', {
    hasMicrosoftConnection,
    isTokenValid,
    tokenExpiresAt: profile?.token_expires_at
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Your basic account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile?.first_name || user?.user_metadata?.first_name || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile?.last_name || user?.user_metadata?.last_name || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <Input
                id="email"
                value={user?.email || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile?.phone || user?.user_metadata?.phone || 'Not provided'}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Microsoft Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            <span>Microsoft 365 Integration</span>
          </CardTitle>
          <CardDescription>
            Connect your Microsoft account to access Outlook, Teams, and SharePoint features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {isTokenValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Not Connected</span>
                  </>
                )}
              </div>
              {isTokenValid && (
                <Badge variant="secondary">Active</Badge>
              )}
            </div>
          </div>

          {!isTokenValid && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                Connect your Microsoft account to enable:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 mb-4">
                <li>• Send emails through Outlook</li>
                <li>• Create and join Teams meetings</li>
                <li>• Access SharePoint documents</li>
                <li>• Sync calendar events</li>
              </ul>
              <MicrosoftOAuthButton onSuccess={() => window.location.reload()} />
            </div>
          )}

          {isTokenValid && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Your Microsoft account is successfully connected. You can now use all integrated features.
              </p>
              {profile?.token_expires_at && (
                <p className="text-xs text-green-600 mt-1">
                  Token expires: {new Date(profile.token_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="meeting-reminders">Meeting Reminders</Label>
              <p className="text-sm text-gray-500">Get reminded about upcoming meetings</p>
            </div>
            <Switch id="meeting-reminders" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="document-updates">Document Updates</Label>
              <p className="text-sm text-gray-500">Notifications when documents are shared</p>
            </div>
            <Switch id="document-updates" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="voting-alerts">Voting Alerts</Label>
              <p className="text-sm text-gray-500">Alerts for new polls and voting deadlines</p>
            </div>
            <Switch id="voting-alerts" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
          <CardDescription>
            Manage your account security and access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Account Security</h4>
            <p className="text-sm text-yellow-700 mb-3">
              Your account is secured with email/password authentication. Contact an administrator to update your credentials.
            </p>
            <Button variant="outline" size="sm">
              Contact Administrator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
