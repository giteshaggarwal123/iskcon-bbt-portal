
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

      // Create a temporary password for the member
      const tempPassword = crypto.randomUUID().substring(0, 12);

      // Step 1: First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: memberData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone,
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user in authentication system');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Step 2: Create the profile entry (this should now work with the auth user ID)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: memberData.email,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Step 3: Create user role entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: memberData.role as ValidRole,
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        // Clean up both profile and auth user if role creation fails
        await supabase.from('profiles').delete().eq('id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw roleError;
      }

      console.log('Member created successfully:', profile);

      // Step 4: Send login credentials via email (using existing send-otp function)
      try {
        const { error: emailError } = await supabase.functions.invoke('send-otp', {
          body: {
            phoneNumber: memberData.email,
            name: `${memberData.firstName} ${memberData.lastName}`,
            type: 'member_credentials',
            tempPassword: tempPassword,
            userId: user?.id
          }
        });

        if (emailError) {
          console.error('Error sending credentials email:', emailError);
          // Don't fail the entire operation for email issues
          toast({
            title: "Member Created",
            description: `${memberData.firstName} ${memberData.lastName} has been added, but credentials email failed to send. Please share the temporary password: ${tempPassword}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Member Created Successfully",
            description: `${memberData.firstName} ${memberData.lastName} has been added and login credentials have been sent via email`,
          });
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        toast({
          title: "Member Created",
          description: `${memberData.firstName} ${memberData.lastName} has been added. Temporary password: ${tempPassword}`,
        });
      }

      return profile;

    } catch (error: any) {
      console.error('Error creating member:', error);
      
      let errorMessage = "Failed to create member";
      
      if (error.code === '23505') {
        errorMessage = "A member with this email already exists";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.message?.includes('admin API')) {
        errorMessage = "Admin privileges required. Please contact your system administrator.";
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
