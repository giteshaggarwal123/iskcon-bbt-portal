
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Bell, Shield, Palette, Globe, Plug } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { NotificationSettings } from './NotificationSettings';
import { ProfileImageUpload } from './ProfileImageUpload';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { useToast } from '@/hooks/use-toast';

export const SettingsModule: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
  });

  // Appearance settings state
  const [appearanceSettings, setAppearanceSettings] = useState({
    darkMode: localStorage.getItem('darkMode') === 'true',
    compactView: localStorage.getItem('compactView') === 'true',
    highContrast: localStorage.getItem('highContrast') === 'true',
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: localStorage.getItem('profileVisibility') !== 'false',
    activityStatus: localStorage.getItem('activityStatus') !== 'false',
    dataAnalytics: localStorage.getItem('dataAnalytics') !== 'false',
  });

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
  };

  const handleImageUpdate = () => {
    // Trigger a refresh of the profile data
    window.location.reload();
  };

  const handleAppearanceChange = (setting: string, value: boolean) => {
    const newSettings = { ...appearanceSettings, [setting]: value };
    setAppearanceSettings(newSettings);
    localStorage.setItem(setting, value.toString());
    
    // Apply the changes immediately
    if (setting === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    if (setting === 'compactView') {
      if (value) {
        document.body.classList.add('compact-view');
      } else {
        document.body.classList.remove('compact-view');
      }
    }
    
    if (setting === 'highContrast') {
      if (value) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    }
    
    toast({
      title: "Appearance Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const handlePrivacyChange = (setting: string, value: boolean) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    localStorage.setItem(setting, value.toString());
    
    toast({
      title: "Privacy Setting Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Plug className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-gray-600">Member</p>
                  <Badge variant="secondary" className="mt-1">
                    Member
                  </Badge>
                </div>
                <ProfileImageUpload onImageUpdate={handleImageUpdate} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed from this interface
                </p>
              </div>

              <div className="flex space-x-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>Microsoft 365 Integration</span>
              </CardTitle>
              <CardDescription>
                Connect your Microsoft 365 account to access Outlook, Teams, and SharePoint features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MicrosoftOAuthButton />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
              <CardDescription>
                Control your privacy settings and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-gray-600">Make your profile visible to other members</p>
                </div>
                <Switch 
                  checked={privacySettings.profileVisibility}
                  onCheckedChange={(checked) => handlePrivacyChange('profileVisibility', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Activity Status</Label>
                  <p className="text-sm text-gray-600">Show when you're online</p>
                </div>
                <Switch 
                  checked={privacySettings.activityStatus}
                  onCheckedChange={(checked) => handlePrivacyChange('activityStatus', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Analytics</Label>
                  <p className="text-sm text-gray-600">Help improve the platform with usage data</p>
                </div>
                <Switch 
                  checked={privacySettings.dataAnalytics}
                  onCheckedChange={(checked) => handlePrivacyChange('dataAnalytics', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-gray-600">Use dark theme</p>
                </div>
                <Switch 
                  checked={appearanceSettings.darkMode}
                  onCheckedChange={(checked) => handleAppearanceChange('darkMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact View</Label>
                  <p className="text-sm text-gray-600">Show more content in less space</p>
                </div>
                <Switch 
                  checked={appearanceSettings.compactView}
                  onCheckedChange={(checked) => handleAppearanceChange('compactView', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>High Contrast</Label>
                  <p className="text-sm text-gray-600">Increase contrast for better visibility</p>
                </div>
                <Switch 
                  checked={appearanceSettings.highContrast}
                  onCheckedChange={(checked) => handleAppearanceChange('highContrast', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
