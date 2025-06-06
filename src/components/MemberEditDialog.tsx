
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Save, X } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  roles: string[];
}

interface MemberEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  onMemberUpdated: () => void;
}

export const MemberEditDialog: React.FC<MemberEditDialogProps> = ({
  open,
  onOpenChange,
  member,
  onMemberUpdated
}) => {
  const [firstName, setFirstName] = useState(member.first_name);
  const [lastName, setLastName] = useState(member.last_name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when member changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setFirstName(member.first_name);
      setLastName(member.last_name);
      setEmail(member.email);
      setPhone(member.phone || '');
    }
  }, [member, open]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Validation Error",
        description: "First name, last name, and email are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Updating member profile:', {
        id: member.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim()
      });

      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', member.id);

      if (error) {
        console.error('Error updating member:', error);
        throw error;
      }

      console.log('Member profile updated successfully');

      toast({
        title: "Success!",
        description: `${firstName} ${lastName}'s information has been updated`
      });

      // Immediately close dialog and trigger refresh
      onOpenChange(false);
      
      // Force immediate refresh of members list
      await onMemberUpdated();

    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update member information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(member.first_name);
    setLastName(member.last_name);
    setEmail(member.email);
    setPhone(member.phone || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Edit Member Information</span>
          </DialogTitle>
          <DialogDescription>
            Update member details. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
