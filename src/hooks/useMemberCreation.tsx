import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

interface MemberData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}

type ValidRole = 'super_admin' | 'admin' | 'member' | 'secretary' | 'treasurer';

const isValidRole = (role: string): role is ValidRole => {
  return ['super_admin', 'admin', 'member', 'secretary', 'treasurer'].includes(role);
};

export const useMemberCreation = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createMemberProfile = async (memberData: MemberData, userId?: string) => {
    const profileId = userId || crypto.randomUUID();
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          email: memberData.email,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone || ''
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      return profileId;
    } catch (error: any) {
      console.error('Error in createMemberProfile:', error);
      throw error;
    }
  };

  const assignUserRole = async (userId: string, role: string) => {
    try {
      // First check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (existingRole) {
        console.log('Role already exists for user');
        return;
      }

      // Validate role before casting
      if (!isValidRole(role)) {
        throw new Error(`Invalid role: ${role}. Must be one of: super_admin, admin, member, secretary, treasurer`);
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Don't throw error for role assignment failure, just log it
        toast({
          title: "Role Assignment Warning",
          description: "Member created but role assignment had issues. Please check member roles.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error in assignUserRole:', error);
    }
  };

  const sendInvitationEmail = async (memberData: MemberData, userId: string) => {
    try {
      const { data: invitationResult, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: memberData.email,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          role: memberData.role,
          userId: userId
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        return { success: false, method: 'failed' };
      }

      return { 
        success: true, 
        method: invitationResult?.method || 'logged',
        loginUrl: invitationResult?.loginUrl 
      };
    } catch (error) {
      console.error('Invitation email failed:', error);
      return { success: false, method: 'failed' };
    }
  };

  const createMember = async (memberData: MemberData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add members",
        variant: "destructive"
      });
      return null;
    }

    // Validate required fields
    if (!memberData.phone || memberData.phone.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Phone number is required for OTP login functionality",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);

    try {
      console.log('Starting member creation process for:', memberData.email);
      
      let userId: string | null = null;
      let authSucceeded = false;

      // Step 1: Check if user already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', memberData.email)
        .single();

      if (existingProfile) {
        toast({
          title: "Member Already Exists",
          description: `A member with email ${memberData.email} already exists in the system.`,
          variant: "destructive"
        });
        return null;
      }

      // Step 2: Try Supabase Auth signup first
      try {
        console.log('Attempting Supabase auth signup...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: memberData.email,
          password: memberData.password,
          options: {
            data: {
              first_name: memberData.firstName,
              last_name: memberData.lastName,
              phone: memberData.phone
            }
          }
        });

        if (authError) {
          console.log('Auth signup error:', authError.message);
          
          // Check for specific rate limit or signup disabled errors
          if (authError.message.includes('rate limit') || 
              authError.message.includes('429') ||
              authError.message.includes('Signups not allowed') ||
              authError.message.includes('signup is disabled')) {
            console.log('Auth signup blocked, proceeding with manual profile creation');
          } else {
            throw authError;
          }
        } else if (authData?.user?.id) {
          userId = authData.user.id;
          authSucceeded = true;
          console.log('Auth signup successful, user ID:', userId);
        }
      } catch (authError: any) {
        console.log('Auth signup failed, will create manual profile:', authError.message);
      }

      // Step 3: Create profile (either with auth user ID or manual ID)
      if (!userId) {
        console.log('Creating member with manual profile...');
        userId = await createMemberProfile(memberData);
        console.log('Manual profile created with ID:', userId);
      } else {
        // If auth succeeded, the trigger should have created the profile
        // But let's verify and update if needed
        console.log('Auth succeeded, checking if profile exists...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (!profile) {
          console.log('Profile not found, creating manually...');
          await createMemberProfile(memberData, userId);
        } else {
          // Update profile with latest data
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: memberData.email,
              first_name: memberData.firstName,
              last_name: memberData.lastName,
              phone: memberData.phone || ''
            })
            .eq('id', userId);
          
          if (updateError) {
            console.error('Profile update error:', updateError);
          }
        }
      }

      // Step 4: Assign role
      if (memberData.role && userId) {
        console.log('Assigning role:', memberData.role);
        await assignUserRole(userId, memberData.role);
      }

      // Step 5: Send invitation email
      console.log('Sending invitation email...');
      const emailResult = await sendInvitationEmail(memberData, userId);

      // Show appropriate success message
      if (emailResult.success && emailResult.method === 'outlook') {
        toast({
          title: "Member Added Successfully!",
          description: `${memberData.firstName} ${memberData.lastName} has been added and invitation sent via Outlook.`
        });
      } else if (emailResult.success && emailResult.method === 'logged') {
        toast({
          title: "Member Added Successfully!",
          description: `${memberData.firstName} ${memberData.lastName} has been added. Please manually share the login details with them at ${memberData.email}.`,
          duration: 8000
        });
      } else {
        toast({
          title: "Member Added (Email Failed)",
          description: `${memberData.firstName} ${memberData.lastName} has been added but invitation email could not be sent. Please contact them manually.`,
          duration: 8000
        });
      }

      console.log('Member creation completed successfully');
      return { id: userId, authSucceeded };

    } catch (error: any) {
      console.error('Member creation failed:', error);
      
      let errorMessage = "An error occurred while adding the member";
      
      if (error.message.includes('profiles_id_fkey') || error.message.includes('foreign key')) {
        errorMessage = "Database configuration issue detected. The member management system needs proper setup.";
      } else if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        errorMessage = "A member with this email already exists.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Too many requests. Please try again in a few minutes.";
      } else if (error.message.includes('permission denied') || error.message.includes('not allowed')) {
        errorMessage = "Permission denied. Please check your admin privileges.";
      }

      toast({
        title: "Failed to Add Member",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createMember,
    loading
  };
};
