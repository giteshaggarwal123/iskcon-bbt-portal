
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'super_admin' | 'admin' | 'secretary' | 'treasurer' | 'member';

interface UseUserRoleReturn {
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSecretary: boolean;
  isTreasurer: boolean;
  isMember: boolean;
  loading: boolean;
  canManageMembers: boolean;
  canManageMeetings: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canCreateContent: boolean;
  canDeleteContent: boolean;
  canEditContent: boolean;
  canEditAllUserInfo: boolean;
  canEditUserRoles: boolean;
  canDeleteUsers: boolean;
  canEditPhoneNumbers: boolean;
  canViewMemberSettings: boolean;
  canViewMembers: boolean;
  canScheduleMeetings: boolean;
  canDeleteMeetings: boolean;
  canEditVoting: boolean;
  canCreateVoting: boolean;
  canVoteOnly: boolean;
  canMarkAttendanceOnly: boolean;
}

export const useUserRole = (): UseUserRoleReturn => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', user.email);
        
        // Check if this is a super admin by email
        if (user.email === 'cs@iskconbureau.in' || user.email === 'admin@iskconbureau.in') {
          console.log('Super admin detected by email');
          
          // Ensure super admin role exists in database
          const { error: upsertError } = await supabase
            .from('user_roles')
            .upsert({ 
              user_id: user.id, 
              role: 'super_admin' 
            }, { 
              onConflict: 'user_id,role' 
            });
          
          if (upsertError) {
            console.error('Error upserting super admin role:', upsertError);
          }
          
          setUserRole('super_admin');
          setLoading(false);
          return;
        }

        // For other users, fetch their role from the database
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('member'); // Default to member if no role found
        } else {
          setUserRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('member');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isSecretary = userRole === 'secretary' || isAdmin;
  const isTreasurer = userRole === 'treasurer' || isAdmin;
  const isMember = userRole === 'member' || isSecretary || isTreasurer || isAdmin || isSuperAdmin;

  // Restricted permissions for member role
  const canManageMembers = isSuperAdmin || isAdmin || isSecretary || isTreasurer; // Members can't see members screen
  const canManageMeetings = isSuperAdmin || isAdmin || isSecretary;
  const canManageDocuments = isSuperAdmin || isAdmin || isSecretary;
  const canViewReports = isSuperAdmin || isAdmin || isTreasurer;
  const canManageSettings = true; // All members can access settings
  
  // Content permissions
  const canCreateContent = isSuperAdmin || isAdmin || isSecretary;
  const canDeleteContent = isSuperAdmin || isAdmin;
  const canEditContent = isSuperAdmin || isAdmin || isSecretary;

  // Enhanced user management permissions
  const canEditAllUserInfo = isSuperAdmin;
  const canEditUserRoles = isSuperAdmin || isAdmin;
  const canDeleteUsers = isSuperAdmin || isAdmin;
  const canEditPhoneNumbers = isSuperAdmin || isAdmin;
  const canViewMemberSettings = isSuperAdmin || isAdmin || isSecretary;

  // New specific permissions for members
  const canViewMembers = isSuperAdmin || isAdmin || isSecretary || isTreasurer; // Members can't see members screen
  const canScheduleMeetings = isSuperAdmin || isAdmin || isSecretary; // Members can't schedule meetings
  const canDeleteMeetings = isSuperAdmin || isAdmin || isSecretary; // Members can't delete meetings
  const canEditVoting = isSuperAdmin || isAdmin || isSecretary; // Members can't edit active voting
  const canCreateVoting = isSuperAdmin || isAdmin || isSecretary; // Members can't create voting
  const canVoteOnly = userRole === 'member'; // Members can only vote
  const canMarkAttendanceOnly = userRole === 'member'; // Members can only mark attendance

  return {
    userRole,
    isSuperAdmin,
    isAdmin,
    isSecretary,
    isTreasurer,
    isMember,
    loading,
    canManageMembers,
    canManageMeetings,
    canManageDocuments,
    canViewReports,
    canManageSettings,
    canCreateContent,
    canDeleteContent,
    canEditContent,
    canEditAllUserInfo,
    canEditUserRoles,
    canDeleteUsers,
    canEditPhoneNumbers,
    canViewMemberSettings,
    canViewMembers,
    canScheduleMeetings,
    canDeleteMeetings,
    canEditVoting,
    canCreateVoting,
    canVoteOnly,
    canMarkAttendanceOnly
  };
};
