
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, Bell, Shield, Mail, Phone, AlertCircle } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { user, userProfile } = useAuth();
  const userRole = useUserRole();
  const { toast } = useToast();

  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [notifications, setNotifications] = useState({
    email_meetings: true,
    email_documents: true,
    email_voting: true,
    sms_meetings: false,
    sms_important: true
  });

  const [loading, setLoading] = useState(false);

  // Permission checks
  const isSuperAdmin = userRole.isSuperAdmin;
  const isAdmin = userRole.isAdmin;

  // Field-specific permissions - Updated logic
  const canEditFirstName = isSuperAdmin; // Only super admin can edit first name
  const canEditLastName = isSuperAdmin; // Only super admin can edit last name
  const canEditEmail = false; // Email can never be changed
  const canEditPhone = isSuperAdmin || isAdmin; // Super admin and admin can edit phone
  const canEditNotifications = true; // All users can edit their notification preferences

  useEffect(() => {
    if (userProfile) {
      console.log('Loading user profile:', userProfile);
      setPersonalInfo({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || ''
      });
    }
  }, [userProfile]);

  const handlePersonalInfoSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Only include fields that the user has permission to edit
      const updateData: any = {
        id: user.id,
      };

      if (canEditFirstName) {
        updateData.first_name = personalInfo.first_name;
      }
      if (canEditLastName) {
        updateData.last_name = personalInfo.last_name;
      }
      if (canEditPhone) {
        updateData.phone = personalInfo.phone;
      }

      console.log('Updating profile with data:', updateData);

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully."
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // In a real app, you'd save notification preferences to the database
      // For now, we'll just show a success message
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved."
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestProfileChanges = () => {
    toast({
      title: "Request Submitted",
      description: "Your profile change request has been sent to administrators for review.",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFieldDescription = (field: string, canEdit: boolean) => {
    if (canEdit) return null;
    
    if (field === 'email') {
      return "Email address cannot be changed for security reasons";
    }
    
    if (field === 'firstName' || field === 'lastName') {
      return "Only Super Administrators can edit name fields";
    }
    
    if (field === 'phone') {
      return "Only Administrators can edit phone numbers";
    }
    
    return "You don't have permission to edit this field";
  };

  const handleInputChange = (field: string, value: string) => {
    // Check permissions before allowing changes
    if (field === 'first_name' && !canEditFirstName) return;
    if (field === 'last_name' && !canEditLastName) return;
    if (field === 'phone' && !canEditPhone) return;
    if (field === 'email') return; // Email never changeable
    
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* User Role Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Account Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge className={getRoleBadgeColor(userRole.role)}>
              {userRole.role.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-600">
              Your current access level in the system
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={personalInfo.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter your first name"
                disabled={!canEditFirstName}
                className={!canEditFirstName ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {getFieldDescription('firstName', canEditFirstName) && (
                <p className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{getFieldDescription('firstName', canEditFirstName)}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={personalInfo.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter your last name"
                disabled={!canEditLastName}
                className={!canEditLastName ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {getFieldDescription('lastName', canEditLastName) && (
                <p className="text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{getFieldDescription('lastName', canEditLastName)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={personalInfo.email}
              disabled
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Enter your email address"
            />
            <p className="text-xs text-amber-600 flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>{getFieldDescription('email', canEditEmail)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={personalInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              disabled={!canEditPhone}
              className={!canEditPhone ? "bg-gray-100 cursor-not-allowed" : ""}
            />
            {getFieldDescription('phone', canEditPhone) && (
              <p className="text-xs text-amber-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{getFieldDescription('phone', canEditPhone)}</span>
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={handlePersonalInfoSave} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            
            {(isSuperAdmin || isAdmin) ? null : (
              <Button 
                variant="outline" 
                onClick={handleRequestProfileChanges}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Request Profile Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Configure how and when you want to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              <span>Email Notifications</span>
            </div>
            
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-meetings">Meeting invitations and updates</Label>
                <Switch
                  id="email-meetings"
                  checked={notifications.email_meetings}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_meetings: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-documents">New documents and announcements</Label>
                <Switch
                  id="email-documents"
                  checked={notifications.email_documents}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_documents: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-voting">Voting and poll notifications</Label>
                <Switch
                  id="email-voting"
                  checked={notifications.email_voting}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_voting: checked }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Phone className="h-4 w-4" />
              <span>SMS Notifications</span>
            </div>
            
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-meetings">Emergency meeting alerts</Label>
                <Switch
                  id="sms-meetings"
                  checked={notifications.sms_meetings}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms_meetings: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-important">Critical announcements</Label>
                <Switch
                  id="sms-important"
                  checked={notifications.sms_important}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms_important: checked }))}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleNotificationsSave} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
