import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Bell, Settings, Mail, Save, MessageCircle, Shield, Lock, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { Badge } from '@/components/ui/badge';
import { ProfileImageUpload } from './ProfileImageUpload';

interface SettingsModuleProps {
  onAvatarUpdate?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onAvatarUpdate }) => {
  const { user } = useAuth();
  const userRole = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  
  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: ''
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    meetingReminders: true,
    documentUpdates: false,
    voteNotifications: true
  });

  // Permission checks
  const canEditPersonalInfo = userRole.isSuperAdmin;
  const canEditEmail = false; // Email can never be changed
  const canEditPhone = userRole.isSuperAdmin || userRole.isAdmin;
  const canEditNotifications = true; // All users can edit their notification preferences
  const canEditProfileImage = true; // All users can edit their profile image

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPersonalInfo({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleImageUpdate = (imageUrl: string) => {
    setPersonalInfo(prev => ({ ...prev, avatar_url: imageUrl }));
    // Trigger avatar refresh in sidebar
    if (onAvatarUpdate) {
      onAvatarUpdate();
    }
  };

  const updatePersonalInfo = async () => {
    if (!user) return;

    // Check permissions before updating
    if (!canEditPersonalInfo && !canEditPhone) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit this information. Contact an administrator.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare update object based on permissions
      const updateData: any = {
        id: user.id,
        updated_at: new Date().toISOString()
      };

      // Super admins can edit names
      if (canEditPersonalInfo) {
        updateData.first_name = personalInfo.first_name;
        updateData.last_name = personalInfo.last_name;
      }

      // Super admins and admins can edit phone
      if (canEditPhone) {
        updateData.phone = personalInfo.phone;
      }

      // Email is never editable
      updateData.email = personalInfo.email;

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdministrator = async () => {
    if (!contactMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message before sending.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('emails')
        .insert({
          sender_id: user?.id,
          recipients: ['admin@iskcon.org'],
          subject: 'Contact Administrator Request',
          body: `Message from ${personalInfo.first_name} ${personalInfo.last_name} (${personalInfo.email}):\n\n${contactMessage}`,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the administrator."
      });
      
      setContactMessage('');
      setContactDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionBadge = (canEdit: boolean) => {
    if (canEdit) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Editable</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 text-xs">Read Only</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
          <div className="flex items-center space-x-2 mt-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              Your role: <strong>{userRole.userRole?.replace('_', ' ') || 'Member'}</strong>
            </span>
          </div>
        </div>
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Administrator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Administrator</DialogTitle>
              <DialogDescription>
                Send a message to the bureau administrator
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleContactAdministrator} disabled={loading}>
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Profile Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Profile Image</span>
              </CardTitle>
              <CardDescription>
                Upload your profile picture (PNG, JPEG only, max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileImageUpload 
                currentImageUrl={personalInfo.avatar_url}
                onImageUpdate={handleImageUpdate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
                {!canEditPersonalInfo && !canEditPhone && (
                  <div className="flex items-center space-x-2 mt-2 p-2 bg-amber-50 rounded-md">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      Contact an administrator to modify your personal information
                    </span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="firstName">First Name</Label>
                    {getPermissionBadge(canEditPersonalInfo)}
                  </div>
                  <Input
                    id="firstName"
                    value={personalInfo.first_name}
                    onChange={(e) => canEditPersonalInfo && setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                    readOnly={!canEditPersonalInfo}
                    className={!canEditPersonalInfo ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="lastName">Last Name</Label>
                    {getPermissionBadge(canEditPersonalInfo)}
                  </div>
                  <Input
                    id="lastName"
                    value={personalInfo.last_name}
                    onChange={(e) => canEditPersonalInfo && setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                    readOnly={!canEditPersonalInfo}
                    className={!canEditPersonalInfo ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="email">Email Address</Label>
                  {getPermissionBadge(canEditEmail)}
                </div>
                <Input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  {getPermissionBadge(canEditPhone)}
                </div>
                <Input
                  id="phone"
                  value={personalInfo.phone}
                  onChange={(e) => canEditPhone && setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  readOnly={!canEditPhone}
                  className={!canEditPhone ? "bg-gray-100 cursor-not-allowed" : ""}
                />
                {!canEditPhone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Phone number can only be changed by administrators
                  </p>
                )}
              </div>
              <Button 
                onClick={updatePersonalInfo} 
                disabled={loading || (!canEditPersonalInfo && !canEditPhone)} 
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              {(!canEditPersonalInfo && !canEditPhone) && (
                <p className="text-sm text-gray-500 text-center">
                  You don't have permission to edit personal information. Contact an administrator for changes.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>Configure how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive general email notifications</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="meeting-reminders">Meeting Reminders</Label>
                  <p className="text-sm text-gray-500">Get reminded about upcoming meetings</p>
                </div>
                <Switch
                  id="meeting-reminders"
                  checked={notificationSettings.meetingReminders}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, meetingReminders: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="document-updates">Document Updates</Label>
                  <p className="text-sm text-gray-500">Notifications when documents are updated</p>
                </div>
                <Switch
                  id="document-updates"
                  checked={notificationSettings.documentUpdates}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, documentUpdates: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="vote-notifications">Vote Notifications</Label>
                  <p className="text-sm text-gray-500">Alerts for new polls and voting deadlines</p>
                </div>
                <Switch
                  id="vote-notifications"
                  checked={notificationSettings.voteNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, voteNotifications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Microsoft Integration</span>
              </CardTitle>
              <CardDescription>Connect your Microsoft account for enhanced features</CardDescription>
            </CardHeader>
            <CardContent>
              <MicrosoftOAuthButton />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
