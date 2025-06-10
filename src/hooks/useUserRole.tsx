import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'super_admin' | 'admin' | 'member';

interface UseUserRoleReturn {
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
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
  canAccessDashboard: boolean;
  canAccessMeetings: boolean;
  canAccessDocuments: boolean;
  canAccessVoting: boolean;
  canAccessAttendance: boolean;
  canAccessEmail: boolean;
  canAccessMembersModule: boolean;
  canAccessReports: boolean;
  canAccessSettings: boolean;
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
        
        // Only cs@iskconbureau.in should be super admin
        if (user.email === 'cs@iskconbureau.in') {
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

        // For all other users, fetch their role from the database
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Default to member if no role found or error occurs
          setUserRole('member');
        } else {
          // Convert legacy roles to member and ensure proper role assignment
          const role = data.role as string;
          if (role === 'secretary' || role === 'treasurer' || role === 'super_admin') {
            // Convert legacy roles and prevent incorrect super admin assignment
            setUserRole('member');
          } else if (role === 'admin') {
            setUserRole('admin');
          } else {
            setUserRole('member');
          }
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

  const isSuperAdmin = userRole === 'super_admin' && user?.email === 'cs@iskconbureau.in';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isMember = userRole === 'member' || isAdmin || isSuperAdmin;

  // Module access permissions
  const canAccessDashboard = true; // All users can access dashboard
  const canAccessMeetings = true; // All users can access meetings
  const canAccessDocuments = true; // All users can access documents
  const canAccessVoting = true; // All users can access voting
  const canAccessAttendance = true; // All users can access attendance
  const canAccessEmail = true; // All users can access email
  const canAccessMembersModule = isSuperAdmin || isAdmin; // Only admins can access members module
  const canAccessReports = isSuperAdmin || isAdmin; // Only admins can access reports
  const canAccessSettings = true; // All users can access settings

  // Existing permissions with member restrictions
  const canManageMembers = isSuperAdmin || isAdmin;
  const canManageMeetings = isSuperAdmin || isAdmin; // Members can view but not manage
  const canManageDocuments = isSuperAdmin || isAdmin;
  const canViewReports = isSuperAdmin || isAdmin; // Members cannot view reports
  const canManageSettings = true; // All members can access settings
  
  // Content permissions
  const canCreateContent = isSuperAdmin || isAdmin;
  const canDeleteContent = isSuperAdmin || isAdmin;
  const canEditContent = isSuperAdmin || isAdmin;

  // Enhanced user management permissions
  const canEditAllUserInfo = isSuperAdmin;
  const canEditUserRoles = isSuperAdmin || isAdmin;
  const canDeleteUsers = isSuperAdmin || isAdmin;
  const canEditPhoneNumbers = isSuperAdmin || isAdmin;
  const canViewMemberSettings = isSuperAdmin || isAdmin;

  // Specific permissions for members
  const canViewMembers = isSuperAdmin || isAdmin;
  const canScheduleMeetings = isSuperAdmin || isAdmin; // Members cannot schedule meetings
  const canDeleteMeetings = isSuperAdmin || isAdmin; // Members cannot delete meetings
  const canEditVoting = isSuperAdmin || isAdmin;
  const canCreateVoting = isSuperAdmin || isAdmin;
  const canVoteOnly = userRole === 'member';
  const canMarkAttendanceOnly = userRole === 'member';

  return {
    userRole,
    isSuperAdmin,
    isAdmin,
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
    canMarkAttendanceOnly,
    canAccessDashboard,
    canAccessMeetings,
    canAccessDocuments,
    canAccessVoting,
    canAccessAttendance,
    canAccessEmail,
    canAccessMembersModule,
    canAccessReports,
    canAccessSettings
  };
};
