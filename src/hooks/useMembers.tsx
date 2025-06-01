
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
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          created_at,
          user_roles(role)
        `);

      if (profilesError) throw profilesError;

      const membersData = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        created_at: profile.created_at,
        last_sign_in_at: null,
        roles: profile.user_roles?.map((ur: any) => ur.role) || []
      })) || [];

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
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: memberData.email,
        password: memberData.password,
        user_metadata: {
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          phone: memberData.phone
        },
        email_confirm: true
      });

      if (authError) throw authError;

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

      // Log activity
      await logActivity('Added new member', `Added ${memberData.firstName} ${memberData.lastName} as ${memberData.role}`);

      toast({
        title: "Member Added Successfully!",
        description: `${memberData.firstName} ${memberData.lastName} has been added to the bureau.`
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
    fetchMembers,
    logActivity
  };
};
