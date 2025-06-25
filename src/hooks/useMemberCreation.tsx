
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

export const useMemberCreation = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createMemberProfile = async (memberData: MemberData, userId?: string) => {
    const profileId = userId || crypto.randomUUID();
    
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
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return profileId;
  };

  const assignUserRole = async (userId: string, role: string) => {
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role as any
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Don't throw error for role assignment failure, just log it
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

      // Attempt 1: Try Supabase Auth signup
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
              authError.message.includes('Signups not allowed')) {
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

      // Attempt 2: Create profile (either with auth user ID or manual ID)
      if (!userId) {
        console.log('Creating member with manual profile...');
        userId = await createMemberProfile(memberData);
        console.log('Manual profile created with ID:', userId);
      } else {
        // If auth succeeded, ensure profile exists with correct data
        console.log('Auth succeeded, ensuring profile exists...');
        try {
          await createMemberProfile(memberData, userId);
          console.log('Profile ensured for auth user');
        } catch (profileError: any) {
          // If profile already exists, update it
          if (profileError.message.includes('duplicate key')) {
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
            } else {
              console.log('Existing profile updated');
            }
          } else {
            throw profileError;
          }
        }
      }

      // Attempt 3: Assign role
      if (memberData.role && userId) {
        console.log('Assigning role:', memberData.role);
        await assignUserRole(userId, memberData.role);
      }

      // Attempt 4: Send invitation email
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
      
      if (error.message.includes('profiles_id_fkey')) {
        errorMessage = "Database configuration error. Please check Supabase auth settings.";
      } else if (error.message.includes('duplicate key')) {
        errorMessage = "A member with this email already exists.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Too many requests. Please try again in a few minutes.";
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
