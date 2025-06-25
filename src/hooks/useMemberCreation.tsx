
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
    console.log('🔍 Starting member creation process...');
    console.log('Current user:', user?.email, user?.id);
    console.log('Member data:', memberData);

    if (!user) {
      console.error('❌ No authenticated user found');
      toast({
        title: "Authentication Required",
        description: "Please sign in to create members",
        variant: "destructive"
      });
      return null;
    }

    // Validate role
    if (!isValidRole(memberData.role)) {
      console.error('❌ Invalid role:', memberData.role);
      toast({
        title: "Invalid Role",
        description: "Please select a valid role for the member",
        variant: "destructive"
      });
      return null;
    }

    setIsCreating(true);

    try {
      console.log('📝 Creating member invitation with data:', memberData);

      // Check current user permissions first
      const { data: currentUserRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleCheckError) {
        console.error('❌ Error checking user permissions:', roleCheckError);
      } else {
        console.log('✅ Current user role:', currentUserRole?.role);
      }

      // Step 1: Create invitation record
      console.log('📋 Step 1: Creating invitation record...');
      const { data: invitation, error: invitationError } = await supabase
        .from('member_invitations')
        .insert({
          email: memberData.email,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone,
          role: memberData.role,
          invited_by: user.id
        })
        .select()
        .single();

      if (invitationError) {
        console.error('❌ Invitation creation error:', invitationError);
        console.error('Error details:', {
          code: invitationError.code,
          message: invitationError.message,
          details: invitationError.details,
          hint: invitationError.hint
        });
        
        if (invitationError.code === '23505') {
          throw new Error('An invitation for this email already exists');
        }
        if (invitationError.code === '42501') {
          throw new Error('Insufficient permissions to create invitations');
        }
        throw invitationError;
      }

      console.log('✅ Invitation created successfully:', invitation);

      // Step 2: Create profile entry for immediate display in members list
      console.log('👤 Step 2: Creating profile entry...');
      const profileId = crypto.randomUUID();
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
        console.error('❌ Profile creation error:', profileError);
        console.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // Clean up invitation if profile creation fails
        console.log('🧹 Cleaning up invitation due to profile error...');
        await supabase.from('member_invitations').delete().eq('id', invitation.id);
        
        if (profileError.code === '23505') {
          throw new Error('A member with this email already exists');
        }
        if (profileError.code === '42501') {
          throw new Error('Insufficient permissions to create profiles');
        }
        throw profileError;
      }

      console.log('✅ Profile created successfully:', profile);

      // Step 3: Create user role entry
      console.log('🛡️ Step 3: Creating user role entry...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileId,
          role: memberData.role as ValidRole,
        });

      if (roleError) {
        console.error('❌ Role creation error:', roleError);
        console.error('Role error details:', {
          code: roleError.code,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint
        });
        
        // Clean up profile and invitation if role creation fails
        console.log('🧹 Cleaning up profile and invitation due to role error...');
        await supabase.from('profiles').delete().eq('id', profileId);
        await supabase.from('member_invitations').delete().eq('id', invitation.id);
        
        if (roleError.code === '42501') {
          throw new Error('Insufficient permissions to assign roles');
        }
        throw roleError;
      }

      console.log('✅ User role created successfully');

      // Step 4: Send invitation email
      console.log('📧 Step 4: Attempting to send invitation email...');
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: memberData.email,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            role: memberData.role,
            userId: user.id
          }
        });

        if (emailError) {
          console.error('❌ Error sending invitation email:', emailError);
          toast({
            title: "Member Created",
            description: `${memberData.firstName} ${memberData.lastName} has been added, but invitation email failed to send. Please share the login details manually.`,
            variant: "default"
          });
        } else {
          console.log('✅ Invitation email sent successfully');
          toast({
            title: "Member Invited Successfully",
            description: `${memberData.firstName} ${memberData.lastName} has been invited and will receive an email with login instructions`,
          });
        }
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        toast({
          title: "Member Created",
          description: `${memberData.firstName} ${memberData.lastName} has been added. Please share the login details manually.`,
        });
      }

      console.log('🎉 Member creation completed successfully!');
      return profile;

    } catch (error: any) {
      console.error('❌ Error creating member:', error);
      
      let errorMessage = "Failed to create member";
      
      if (error.message?.includes('invitation for this email already exists')) {
        errorMessage = "An invitation for this email is already pending";
      } else if (error.message?.includes('member with this email already exists')) {
        errorMessage = "A member with this email already exists";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.message?.includes('not allowed') || error.message?.includes('Insufficient permissions')) {
        errorMessage = "Insufficient permissions. Please contact your system administrator.";
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
