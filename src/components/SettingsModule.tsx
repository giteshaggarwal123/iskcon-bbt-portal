
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
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Your role: <strong>{userRole.userRole?.replace('_', ' ') || 'Member'}</strong>
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto h-10">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Contact Admin</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
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
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button variant="outline" onClick={() => setContactDialogOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={handleContactAdministrator} disabled={loading} className="w-full sm:w-auto">
                      <Mail className="h-4 w-4 mr-2" />
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs Section - Mobile Optimized */}
        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full grid grid-cols-2 h-10">
            <TabsTrigger value="profile" className="text-xs sm:text-sm truncate">
              Profile & Account
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs sm:text-sm truncate">
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 sm:space-y-6 mt-0">
            {/* Profile Image Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Profile Image</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Upload your profile picture (PNG, JPEG only, max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ProfileImageUpload 
                  currentImageUrl={personalInfo.avatar_url}
                  onImageUpdate={handleImageUpdate}
                />
              </CardContent>
            </Card>

            {/* Personal Information Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Update your personal details and contact information
                  {!canEditPersonalInfo && !canEditPhone && (
                    <div className="flex items-start space-x-2 mt-2 p-2 bg-amber-50 rounded-md">
                      <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-amber-700">
                        Contact an administrator to modify your personal information
                      </span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="firstName" className="text-sm">First Name</Label>
                        {getPermissionBadge(canEditPersonalInfo)}
                      </div>
                      <Input
                        id="firstName"
                        value={personalInfo.first_name}
                        onChange={(e) => canEditPersonalInfo && setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Enter your first name"
                        readOnly={!canEditPersonalInfo}
                        className={`h-10 ${!canEditPersonalInfo ? "bg-muted cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                        {getPermissionBadge(canEditPersonalInfo)}
                      </div>
                      <Input
                        id="lastName"
                        value={personalInfo.last_name}
                        onChange={(e) => canEditPersonalInfo && setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Enter your last name"
                        readOnly={!canEditPersonalInfo}
                        className={`h-10 ${!canEditPersonalInfo ? "bg-muted cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-sm">Email Address</Label>
                      {getPermissionBadge(canEditEmail)}
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      readOnly
                      className="h-10 bg-muted cursor-not-allowed"
                      placeholder="Enter your email address"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed for security reasons</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                      {getPermissionBadge(canEditPhone)}
                    </div>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => canEditPhone && setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                      readOnly={!canEditPhone}
                      className={`h-10 ${!canEditPhone ? "bg-muted cursor-not-allowed" : ""}`}
                    />
                    {!canEditPhone && (
                      <p className="text-xs text-muted-foreground">
                        Phone number can only be changed by administrators
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={updatePersonalInfo} 
                    disabled={loading || (!canEditPersonalInfo && !canEditPhone)} 
                    className="w-full h-10"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  {(!canEditPersonalInfo && !canEditPhone) && (
                    <p className="text-xs text-muted-foreground text-center">
                      You don't have permission to edit personal information. Contact an administrator for changes.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription className="text-sm">Configure how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive general email notifications</p>
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
                    <div className="space-y-1">
                      <Label htmlFor="meeting-reminders" className="text-sm font-medium">Meeting Reminders</Label>
                      <p className="text-xs text-muted-foreground">Get reminded about upcoming meetings</p>
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
                    <div className="space-y-1">
                      <Label htmlFor="document-updates" className="text-sm font-medium">Document Updates</Label>
                      <p className="text-xs text-muted-foreground">Notifications when documents are updated</p>
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
                    <div className="space-y-1">
                      <Label htmlFor="vote-notifications" className="text-sm font-medium">Vote Notifications</Label>
                      <p className="text-xs text-muted-foreground">Alerts for new polls and voting deadlines</p>
                    </div>
                    <Switch
                      id="vote-notifications"
                      checked={notificationSettings.voteNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, voteNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Microsoft Integration</span>
                </CardTitle>
                <CardDescription className="text-sm">Connect your Microsoft account for enhanced features</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <MicrosoftOAuthButton />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
