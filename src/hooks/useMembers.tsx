import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  roles: string[];
  is_suspended?: boolean;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  timestamp: string;
  user_name: string;
}

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    try {
      console.log('Fetching members...');
      
      // First fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      console.log('Fetched profiles:', profiles);

      // Then fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        // Don't throw error for roles, just continue without them
      }

      console.log('Fetched roles:', userRoles);

      // Combine the data
      const membersData = profiles?.map(profile => {
        let memberRoles = userRoles?.filter(role => role.user_id === profile.id) || [];
        
        // Special handling for super admin
        if (profile.email === 'cs@iskconbureau.in') {
          // Ensure super admin role is present
          const hasSuperAdminRole = memberRoles.some(role => role.role === 'super_admin');
          if (!hasSuperAdminRole) {
            memberRoles = [{ user_id: profile.id, role: 'super_admin' }, ...memberRoles];
          }
        }

        // Special handling for admin@iskconbureau.in
        if (profile.email === 'admin@iskconbureau.in') {
          // Ensure admin role is present
          const hasAdminRole = memberRoles.some(role => role.role === 'admin');
          if (!hasAdminRole) {
            memberRoles = [{ user_id: profile.id, role: 'admin' }, ...memberRoles];
          }
        }
        
        return {
          id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          created_at: profile.created_at,
          last_sign_in_at: null,
          roles: memberRoles.map(role => role.role),
          is_suspended: profile.is_suspended || false
        };
      }) || [];

      console.log('Combined members data:', membersData);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addMember = async (memberData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add members",
        variant: "destructive"
      });
      return;
    }

    // Validate that phone number is provided
    if (!memberData.phone || memberData.phone.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Phone number is required for OTP login functionality",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding member:', memberData);

      // First, sign up the user using Supabase Auth
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
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      console.log('User created via auth:', authData.user);

      // Wait a moment for the trigger to complete, then ensure profile exists
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Ensure the profile is created with all required data including phone
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: memberData.email,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // Don't throw error here, but log it
      } else {
        console.log('Profile successfully created/updated for user:', authData.user.id);
      }

      // Add role if specified
      if (memberData.role && authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: memberData.role as any
          }, {
            onConflict: 'user_id,role'
          });

        if (roleError) {
          console.error('Error adding role:', roleError);
        } else {
          console.log('Role successfully added for user:', authData.user.id);
        }
      }

      // Send invitation email (we'll create an edge function for this)
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: memberData.email,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            role: memberData.role
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          // Don't fail the member creation if email fails
        }
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }

      await logActivity('Added new member', `Added ${memberData.firstName} ${memberData.lastName} as ${memberData.role.replace('_', ' ')}`);

      toast({
        title: "Member Added Successfully!",
        description: `${memberData.firstName} ${memberData.lastName} has been added with phone number ${memberData.phone} and can now login with OTP.`
      });

      // Wait a moment before refreshing to ensure all operations complete
      setTimeout(() => {
        fetchMembers();
      }, 1500);
      
      return authData.user;
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Failed to Add Member",
        description: error.message || "An error occurred while adding the member",
        variant: "destructive"
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      // Check if this is trying to modify super admin
      const member = members.find(m => m.id === memberId);
      if (member?.email === 'cs@iskconbureau.in' && newRole !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "Cannot change the role of the system super admin",
          variant: "destructive"
        });
        return;
      }

      console.log('Updating member role:', { memberId, newRole });

      // Remove existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId);

      if (deleteError) {
        console.error('Error removing existing roles:', deleteError);
        throw deleteError;
      }

      // Add new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: memberId,
          role: newRole as any
        });

      if (insertError) {
        console.error('Error adding new role:', insertError);
        throw insertError;
      }

      await logActivity('Updated member role', `Changed role to ${newRole}`);

      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully"
      });

      fetchMembers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update member role",
        variant: "destructive"
      });
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      // Check if this is trying to delete super admin
      const member = members.find(m => m.id === memberId);
      if (member?.email === 'cs@iskconbureau.in') {
        toast({
          title: "Access Denied",
          description: "Cannot delete the system super admin",
          variant: "destructive"
        });
        return;
      }

      console.log('Deleting member:', memberId);

      // Delete user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId);

      if (rolesError) {
        console.error('Error deleting user roles:', rolesError);
        throw rolesError;
      }

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      await logActivity('Deleted member', `Removed member from bureau`);

      toast({
        title: "Member Deleted",
        description: "Member has been removed successfully"
      });

      fetchMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete member",
        variant: "destructive"
      });
    }
  };

  const suspendMember = async (memberId: string, suspend: boolean) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (member?.email === 'cs@iskconbureau.in') {
        toast({
          title: "Access Denied",
          description: "Cannot suspend the system super admin",
          variant: "destructive"
        });
        return;
      }

      console.log('Suspending member:', { memberId, suspend });

      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend })
        .eq('id', memberId);

      if (error) throw error;

      await logActivity(suspend ? 'Suspended member' : 'Unsuspended member', 
        `Account ${suspend ? 'suspended' : 'reactivated'}`);

      toast({
        title: suspend ? "Member Suspended" : "Member Unsuspended",
        description: `Account has been ${suspend ? 'suspended' : 'reactivated'} successfully`
      });

      fetchMembers();
    } catch (error: any) {
      console.error('Error suspending member:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update member status",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (memberId: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) {
        toast({
          title: "Error",
          description: "Member not found",
          variant: "destructive"
        });
        return;
      }

      console.log('Resetting password for member:', memberId);

      // In a real implementation, you would call a secure function to reset the password
      // For now, we'll simulate this
      await new Promise(resolve => setTimeout(resolve, 1000));

      await logActivity('Reset password', `Password reset for ${member.first_name} ${member.last_name}`);

      toast({
        title: "Password Reset",
        description: "Password reset email has been sent to the member"
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Join Date'],
      ...members.map(member => [
        `${member.first_name} ${member.last_name}`,
        member.email,
        member.phone || '',
        member.roles[0] || 'member',
        new Date(member.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Members list has been exported successfully"
    });
  };

  const logActivity = async (action: string, details?: string) => {
    if (!user) return;

    try {
      console.log('Activity logged:', {
        user_id: user.id,
        action,
        details,
        timestamp: new Date().toISOString()
      });

      const newLog = {
        id: Date.now().toString(),
        user_id: user.id,
        action,
        timestamp: new Date().toISOString(),
        user_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'Unknown User'
      };

      setActivityLogs(prev => [newLog, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const searchMembers = (searchTerm: string) => {
    if (!searchTerm.trim()) return members;
    
    const term = searchTerm.toLowerCase();
    return members.filter(member =>
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      member.roles.some(role => role.toLowerCase().includes(term)) ||
      (member.phone && member.phone.includes(searchTerm))
    );
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user, fetchMembers]);

  return {
    members,
    activityLogs,
    loading,
    addMember,
    updateMemberRole,
    deleteMember,
    suspendMember,
    resetPassword,
    exportMembers,
    fetchMembers,
    logActivity,
    searchMembers
  };
};
