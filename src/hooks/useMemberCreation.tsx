
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
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
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

      // Generate a UUID for the new profile
      const profileId = crypto.randomUUID();

      // Step 1: Create the profile with generated ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          email: memberData.email,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Step 2: Create user role entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileId,
          role: memberData.role as ValidRole,
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        // Clean up profile if role creation fails
        await supabase.from('profiles').delete().eq('id', profileId);
        throw roleError;
      }

      console.log('Profile created successfully:', profile);

      toast({
        title: "Member Created Successfully",
        description: `${memberData.firstName} ${memberData.lastName} has been added to the system`,
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
