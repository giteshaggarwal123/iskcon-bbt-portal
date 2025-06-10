
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Bell, Settings, Mail, Save, MessageCircle, Shield, Lock, Camera, Send, Paperclip, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';
import { Badge } from '@/components/ui/badge';
import { ProfileImageUpload } from './ProfileImageUpload';
import { SentMessagesTab } from './SentMessagesTab';
import { useIsMobile } from '@/hooks/use-mobile';

interface SettingsModuleProps {
  onAvatarUpdate?: () => void;
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
  contentBytes?: string;
  contentType?: string;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onAvatarUpdate }) => {
  const { user } = useAuth();
  const userRole = useUserRole();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Personal Information State - Initialize from profile
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

  // File upload constraints
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, user]);

  const handleImageUpdate = (imageUrl: string) => {
    setPersonalInfo(prev => ({ ...prev, avatar_url: imageUrl }));
    // Update profile immediately
    updateProfile({ avatar_url: imageUrl });
    // Trigger avatar refresh in sidebar
    if (onAvatarUpdate) {
      onAvatarUpdate();
    }
  };

  const updatePersonalInfo = async () => {
    if (!user || !profile) return;

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
      const updateData: any = {};

      // Super admins can edit names
      if (canEditPersonalInfo) {
        updateData.first_name = personalInfo.first_name.trim();
        updateData.last_name = personalInfo.last_name.trim();
      }

      // Super admins and admins can edit phone
      if (canEditPhone) {
        updateData.phone = personalInfo.phone.trim();
      }

      // Email is never editable but keep it synced
      updateData.email = personalInfo.email;

      // Update profile using the hook
      const { error } = await updateProfile(updateData);

      if (!error) {
        // Trigger global profile refresh
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { profile: { ...profile, ...updateData }, userId: user.id } 
        }));
      }
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

  const handleFileAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (attachedFiles.length + files.length > MAX_FILES) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${MAX_FILES} files allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploadingFiles(true);
    const validFiles: AttachedFile[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        validFiles.push({
          file,
          name: file.name,
          size: file.size,
          contentBytes: base64Content,
          contentType: file.type
        });
      } catch (error) {
        errors.push(`${file.name}: Failed to process file`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "File Upload Errors",
        description: errors.join(', '),
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }

    setUploadingFiles(false);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          body: `Message from ${personalInfo.first_name} ${personalInfo.last_name} (${personalInfo.email}):\n\n${contactMessage}${attachedFiles.length > 0 ? `\n\nAttachments: ${attachedFiles.map(f => f.name).join(', ')}` : ''}`,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the administrator. You can view it in the 'Sent Messages' tab."
      });
      
      setContactMessage('');
      setAttachedFiles([]);
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

  if (profileLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .settings-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .settings-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .settings-header-text h1 {
            font-size: 1.5rem !important;
            line-height: 2rem !important;
            font-weight: 600 !important;
          }
          .settings-header-text p {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          .settings-header button {
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            padding: 0.5rem 0.75rem !important;
            height: 2rem !important;
            width: 100% !important;
          }
          .settings-tabs-list {
            height: auto !important;
          }
          .settings-tabs-trigger {
            font-size: 0.6rem !important;
            padding: 0.5rem 0.25rem !important;
            white-space: nowrap !important;
          }
          .settings-card-title {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
          }
          .settings-card-description {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
          .settings-form-label {
            font-size: 0.75rem !important;
          }
          .settings-form-input {
            font-size: 0.875rem !important;
            height: 2.5rem !important;
          }
          .settings-save-button {
            font-size: 0.75rem !important;
            padding: 0.5rem 1rem !important;
            height: 2.5rem !important;
          }
          .settings-contact-dialog {
            width: 95vw !important;
            max-width: 28rem !important;
            margin: 0 auto !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          .notification-item {
            padding: 1rem 0 !important;
          }
          .notification-label {
            font-size: 0.75rem !important;
          }
          .notification-description {
            font-size: 0.625rem !important;
          }
        }
      `}</style>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 settings-container">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 settings-header">
            <div className="min-w-0 flex-1 settings-header-text">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-2xl sm:text-3xl'} font-bold text-foreground break-words`}>
                Settings
              </h1>
              <p className={`${isMobile ? 'text-sm' : 'text-sm sm:text-base'} text-muted-foreground mt-1`}>
                Manage your account settings and preferences
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}>
                  Your role: <strong>{userRole.userRole?.replace('_', ' ') || 'Member'}</strong>
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className={`${isMobile ? 'w-full' : 'w-full sm:w-auto'} h-10`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">Contact Admin</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className={`${isMobile ? 'settings-contact-dialog' : 'w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto'}`}>
                  <DialogHeader>
                    <DialogTitle className={isMobile ? 'text-base' : ''}>Contact Administrator</DialogTitle>
                    <DialogDescription className={isMobile ? 'text-sm' : ''}>
                      Send a message to the bureau administrator
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="message" className={isMobile ? 'text-sm' : ''}>Message</Label>
                      <Textarea
                        id="message"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={4}
                        className={isMobile ? 'text-sm' : ''}
                      />
                    </div>

                    {/* File Attachments */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className={isMobile ? 'text-sm' : ''}>File Attachments</Label>
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                          Max {MAX_FILES} files, 10MB each
                        </span>
                      </div>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.pptx,.xlsx,.txt,.jpg,.jpeg,.png"
                          onChange={handleFileAttachment}
                          className="hidden"
                          id="file-upload"
                          disabled={loading || uploadingFiles}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="text-center">
                            <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                              Click to attach files or drag and drop
                            </p>
                            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
                              Supported: PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG
                            </p>
                          </div>
                        </label>
                      </div>

                      {attachedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Attached Files:</p>
                          {attachedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <Paperclip className="h-4 w-4 text-gray-500" />
                                <span className={isMobile ? 'text-xs' : 'text-sm'}>{file.name}</span>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>({formatFileSize(file.size)})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0"
                                type="button"
                                disabled={loading || uploadingFiles}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setContactDialogOpen(false)} 
                        className={`${isMobile ? 'w-full text-sm py-2' : 'w-full sm:w-auto'}`}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleContactAdministrator} 
                        disabled={loading || uploadingFiles} 
                        className={`${isMobile ? 'w-full text-sm py-2' : 'w-full sm:w-auto'}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
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
            <TabsList className={`w-full grid grid-cols-3 ${isMobile ? 'h-auto settings-tabs-list' : 'h-10'}`}>
              <TabsTrigger 
                value="profile" 
                className={`${isMobile ? 'text-xs px-1 py-3 flex-1 settings-tabs-trigger' : 'text-xs sm:text-sm'} truncate`}
              >
                {isMobile ? 'Profile' : 'Profile & Account'}
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className={`${isMobile ? 'text-xs px-1 py-3 flex-1 settings-tabs-trigger' : 'text-xs sm:text-sm'} truncate`}
              >
                {isMobile ? 'Messages' : 'Sent Messages'}
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className={`${isMobile ? 'text-xs px-1 py-3 flex-1 settings-tabs-trigger' : 'text-xs sm:text-sm'} truncate`}
              >
                Integrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 sm:space-y-6 mt-0">
              {/* Profile Image Section */}
              <Card>
                <CardHeader className={`${isMobile ? 'p-4 pb-3' : 'pb-4'}`}>
                  <CardTitle className={`${isMobile ? 'text-base settings-card-title' : 'text-lg sm:text-xl'} flex items-center space-x-2`}>
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Profile Image</span>
                  </CardTitle>
                  <CardDescription className={`${isMobile ? 'text-xs settings-card-description' : 'text-sm'}`}>
                    Upload your profile picture (PNG, JPEG only, max 5MB)
                  </CardDescription>
                </CardHeader>
                <CardContent className={`${isMobile ? 'p-4 pt-0' : 'pt-0'}`}>
                  <ProfileImageUpload 
                    currentImageUrl={personalInfo.avatar_url}
                    onImageUpdate={handleImageUpdate}
                  />
                </CardContent>
              </Card>

              {/* Personal Information Section */}
              <Card>
                <CardHeader className={`${isMobile ? 'p-4 pb-3' : 'pb-4'}`}>
                  <CardTitle className={`${isMobile ? 'text-base settings-card-title' : 'text-lg sm:text-xl'} flex items-center space-x-2`}>
                    <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription className={`${isMobile ? 'text-xs settings-card-description' : 'text-sm'}`}>
                    Update your personal details and contact information
                    {!canEditPersonalInfo && !canEditPhone && (
                      <div className="flex items-start space-x-2 mt-2 p-2 bg-amber-50 rounded-md">
                        <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-amber-700`}>
                          Contact an administrator to modify your personal information
                        </span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className={`${isMobile ? 'p-4 pt-0' : 'pt-0'}`}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="firstName" className={`${isMobile ? 'text-xs settings-form-label' : 'text-sm'}`}>First Name</Label>
                          {getPermissionBadge(canEditPersonalInfo)}
                        </div>
                        <Input
                          id="firstName"
                          value={personalInfo.first_name}
                          onChange={(e) => canEditPersonalInfo && setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="Enter your first name"
                          readOnly={!canEditPersonalInfo}
                          className={`${isMobile ? 'settings-form-input' : 'h-10'} ${!canEditPersonalInfo ? "bg-muted cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="lastName" className={`${isMobile ? 'text-xs settings-form-label' : 'text-sm'}`}>Last Name</Label>
                          {getPermissionBadge(canEditPersonalInfo)}
                        </div>
                        <Input
                          id="lastName"
                          value={personalInfo.last_name}
                          onChange={(e) => canEditPersonalInfo && setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Enter your last name"
                          readOnly={!canEditPersonalInfo}
                          className={`${isMobile ? 'settings-form-input' : 'h-10'} ${!canEditPersonalInfo ? "bg-muted cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email" className={`${isMobile ? 'text-xs settings-form-label' : 'text-sm'}`}>Email Address</Label>
                        {getPermissionBadge(canEditEmail)}
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        readOnly
                        className={`${isMobile ? 'settings-form-input' : 'h-10'} bg-muted cursor-not-allowed`}
                        placeholder="Enter your email address"
                      />
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>Email cannot be changed for security reasons</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone" className={`${isMobile ? 'text-xs settings-form-label' : 'text-sm'}`}>Phone Number</Label>
                        {getPermissionBadge(canEditPhone)}
                      </div>
                      <Input
                        id="phone"
                        value={personalInfo.phone}
                        onChange={(e) => canEditPhone && setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                        readOnly={!canEditPhone}
                        className={`${isMobile ? 'settings-form-input' : 'h-10'} ${!canEditPhone ? "bg-muted cursor-not-allowed" : ""}`}
                      />
                      {!canEditPhone && (
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                          Phone number can only be changed by administrators
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={updatePersonalInfo} 
                      disabled={loading || (!canEditPersonalInfo && !canEditPhone)} 
                      className={`w-full ${isMobile ? 'settings-save-button' : 'h-10'}`}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    {(!canEditPersonalInfo && !canEditPhone) && (
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground text-center`}>
                        You don't have permission to edit personal information. Contact an administrator for changes.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences Section */}
              <Card>
                <CardHeader className={`${isMobile ? 'p-4 pb-3' : 'pb-4'}`}>
                  <CardTitle className={`${isMobile ? 'text-base settings-card-title' : 'text-lg sm:text-xl'} flex items-center space-x-2`}>
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription className={`${isMobile ? 'text-xs settings-card-description' : 'text-sm'}`}>Configure how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className={`${isMobile ? 'p-4 pt-0' : 'pt-0'}`}>
                  <div className="space-y-6">
                    <div className={`flex items-center justify-between ${isMobile ? 'notification-item' : ''}`}>
                      <div className="space-y-1">
                        <Label htmlFor="email-notifications" className={`${isMobile ? 'text-xs notification-label' : 'text-sm'} font-medium`}>Email Notifications</Label>
                        <p className={`${isMobile ? 'text-xs notification-description' : 'text-xs'} text-muted-foreground`}>Receive general email notifications</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                    <div className={`flex items-center justify-between ${isMobile ? 'notification-item' : ''}`}>
                      <div className="space-y-1">
                        <Label htmlFor="meeting-reminders" className={`${isMobile ? 'text-xs notification-label' : 'text-sm'} font-medium`}>Meeting Reminders</Label>
                        <p className={`${isMobile ? 'text-xs notification-description' : 'text-xs'} text-muted-foreground`}>Get reminded about upcoming meetings</p>
                      </div>
                      <Switch
                        id="meeting-reminders"
                        checked={notificationSettings.meetingReminders}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, meetingReminders: checked }))
                        }
                      />
                    </div>
                    <div className={`flex items-center justify-between ${isMobile ? 'notification-item' : ''}`}>
                      <div className="space-y-1">
                        <Label htmlFor="document-updates" className={`${isMobile ? 'text-xs notification-label' : 'text-sm'} font-medium`}>Document Updates</Label>
                        <p className={`${isMobile ? 'text-xs notification-description' : 'text-xs'} text-muted-foreground`}>Notifications when documents are updated</p>
                      </div>
                      <Switch
                        id="document-updates"
                        checked={notificationSettings.documentUpdates}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, documentUpdates: checked }))
                        }
                      />
                    </div>
                    <div className={`flex items-center justify-between ${isMobile ? 'notification-item' : ''}`}>
                      <div className="space-y-1">
                        <Label htmlFor="vote-notifications" className={`${isMobile ? 'text-xs notification-label' : 'text-sm'} font-medium`}>Vote Notifications</Label>
                        <p className={`${isMobile ? 'text-xs notification-description' : 'text-xs'} text-muted-foreground`}>Alerts for new polls and voting deadlines</p>
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

            <TabsContent value="messages" className="mt-0">
              <SentMessagesTab />
            </TabsContent>

            <TabsContent value="integrations" className="mt-0">
              <Card>
                <CardHeader className={`${isMobile ? 'p-4 pb-3' : 'pb-4'}`}>
                  <CardTitle className={`${isMobile ? 'text-base settings-card-title' : 'text-lg sm:text-xl'} flex items-center space-x-2`}>
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Microsoft Integration</span>
                  </CardTitle>
                  <CardDescription className={`${isMobile ? 'text-xs settings-card-description' : 'text-sm'}`}>Connect your Microsoft account for enhanced features</CardDescription>
                </CardHeader>
                <CardContent className={`${isMobile ? 'p-4 pt-0' : 'pt-0'}`}>
                  <MicrosoftOAuthButton />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};
