
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Calendar, Shield, Save, Edit } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  roles: string[];
}

interface MemberSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
}

export const MemberSettingsDialog: React.FC<MemberSettingsDialogProps> = ({
  open,
  onOpenChange,
  member
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedMember, setEditedMember] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone || ''
  });

  const userRole = useUserRole();
  const { toast } = useToast();
  const joinDate = new Date(member.created_at).toLocaleDateString();
  const primaryRole = member.roles[0] || 'member';

  // Reset edited member when member prop changes
  React.useEffect(() => {
    setEditedMember({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || ''
    });
    setIsEditing(false);
  }, [member]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update the profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedMember.first_name,
          last_name: editedMember.last_name,
          email: editedMember.email,
          phone: editedMember.phone
        })
        .eq('id', member.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Member Updated",
        description: "Member information has been updated successfully"
      });

      setIsEditing(false);
      // Close dialog to refresh the member list
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update member information",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedMember({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || ''
    });
    setIsEditing(false);
  };

  const canEdit = userRole.isSuperAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Member Settings</span>
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edit member information' : `Manage settings and information for ${member.first_name} ${member.last_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Member Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">First Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedMember.first_name}
                      onChange={(e) => setEditedMember(prev => ({ ...prev, first_name: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{member.first_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedMember.last_name}
                      onChange={(e) => setEditedMember(prev => ({ ...prev, last_name: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{member.last_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedMember.email}
                      onChange={(e) => setEditedMember(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center space-x-2 mt-1">
                      <Mail className="h-4 w-4" />
                      <span>{member.email}</span>
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedMember.phone}
                      onChange={(e) => setEditedMember(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center space-x-2 mt-1">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone || 'Not provided'}</span>
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Join Date</Label>
                  <p className="text-gray-900 flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{joinDate}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Role</Label>
                  <p className="text-gray-900 flex items-center space-x-2 mt-1">
                    <Shield className="h-4 w-4" />
                    <Badge>{primaryRole}</Badge>
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-2 pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage account settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Reset Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Suspend Account
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  View Activity Log
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
