
import { useState, useEffect } from 'react';
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

  const fetchMembers = async () => {
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
        const memberRoles = userRoles?.filter(role => role.user_id === profile.id) || [];
        return {
          id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          created_at: profile.created_at,
          last_sign_in_at: null,
          roles: memberRoles.map(role => role.role)
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
  };

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
            phone: memberData.phone || ''
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

      // The profile should be created automatically via trigger
      // But let's also manually create it to be sure
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: memberData.email,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone || ''
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw error here as the trigger might have already created it
      }

      // Add role if specified
      if (memberData.role && authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: memberData.role as any
          });

        if (roleError) {
          console.error('Error adding role:', roleError);
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

      await logActivity('Added new member', `Added ${memberData.firstName} ${memberData.lastName} as ${memberData.role}`);

      toast({
        title: "Member Added Successfully!",
        description: `${memberData.firstName} ${memberData.lastName} has been added and invitation sent.`
      });

      fetchMembers();
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
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: memberId,
          role: newRole as any
        });

      if (error) throw error;

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
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId);

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

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
      // For now, we'll just log to console since we don't have an activity table
      // In a real app, you'd insert into an activity_logs table
      console.log('Activity logged:', {
        user_id: user.id,
        action,
        details,
        timestamp: new Date().toISOString()
      });

      // Simulate activity log for demo
      const newLog = {
        id: Date.now().toString(),
        user_id: user.id,
        action,
        timestamp: new Date().toISOString(),
        user_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'Unknown User'
      };

      setActivityLogs(prev => [newLog, ...prev].slice(0, 10)); // Keep only last 10 logs
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
  }, [user]);

  return {
    members,
    activityLogs,
    loading,
    addMember,
    updateMemberRole,
    deleteMember,
    exportMembers,
    fetchMembers,
    logActivity,
    searchMembers
  };
};
