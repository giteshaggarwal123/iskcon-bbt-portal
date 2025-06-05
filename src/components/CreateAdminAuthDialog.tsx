
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMembers } from '@/hooks/useMembers';

interface CreateAdminAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAdminAuthDialog: React.FC<CreateAdminAuthDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [password, setPassword] = useState('Admin@Iskcon');
  const [loading, setLoading] = useState(false);
  const { createAuthAccountForExistingProfile } = useMembers();

  const handleCreateAuth = async () => {
    setLoading(true);
    try {
      await createAuthAccountForExistingProfile('admin@iskconbureau.in', password);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create auth account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Auth Account for Admin</DialogTitle>
          <DialogDescription>
            Create a Supabase authentication account for admin@iskconbureau.in
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value="admin@iskconbureau.in" 
              disabled 
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password for admin user"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAuth}
              disabled={loading || !password}
            >
              {loading ? 'Creating...' : 'Create Auth Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
