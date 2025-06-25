
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type ValidRole = 'super_admin' | 'admin' | 'member' | 'secretary' | 'treasurer';

const isValidRole = (role: string): role is ValidRole => {
  return ['super_admin', 'admin', 'member', 'secretary', 'treasurer'].includes(role);
};

export const useMemberCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createMember = async (memberData: {
    email: string;
    full_name: string;
    role: string;
    phone?: string;
    address?: string;
    emergency_contact?: string;
    notes?: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create members",
        variant: "destructive"
      });
      return null;
    }

    // Validate role
    if (!isValidRole(memberData.role)) {
      toast({
        title: "Invalid Role",
        description: "Please select a valid role for the member",
        variant: "destructive"
      });
      return null;
    }

    setIsCreating(true);

    try {
      console.log('Creating member with data:', memberData);

      // Step 1: Create the profile directly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: memberData.email,
          full_name: memberData.full_name,
          role: memberData.role as ValidRole, // Now TypeScript knows this is a valid role
          phone: memberData.phone,
          address: memberData.address,
          emergency_contact: memberData.emergency_contact,
          notes: memberData.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully:', profile);

      toast({
        title: "Member Created Successfully",
        description: `${memberData.full_name} has been added to the system`,
      });

      return profile;

    } catch (error: any) {
      console.error('Error creating member:', error);
      
      let errorMessage = "Failed to create member";
      
      if (error.code === '23505') {
        errorMessage = "A member with this email already exists";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createMember,
    isCreating
  };
};
