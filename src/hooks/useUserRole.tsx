
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
          // Convert legacy roles to member
          const role = data.role as string;
          if (role === 'secretary' || role === 'treasurer') {
            setUserRole('member');
          } else {
            setUserRole(data.role as UserRole);
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

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isMember = userRole === 'member' || isAdmin || isSuperAdmin;

  // Updated permissions for simplified role structure
  const canManageMembers = isSuperAdmin || isAdmin; // Only admins can manage members
  const canManageMeetings = isSuperAdmin || isAdmin; // Only admins can manage meetings
  const canManageDocuments = isSuperAdmin || isAdmin; // Only admins can manage documents
  const canViewReports = isSuperAdmin || isAdmin; // Only admins can view reports
  const canManageSettings = true; // All members can access settings
  
  // Content permissions
  const canCreateContent = isSuperAdmin || isAdmin; // Only admins can create content
  const canDeleteContent = isSuperAdmin || isAdmin; // Only admins can delete content
  const canEditContent = isSuperAdmin || isAdmin; // Only admins can edit content

  // Enhanced user management permissions
  const canEditAllUserInfo = isSuperAdmin;
  const canEditUserRoles = isSuperAdmin || isAdmin;
  const canDeleteUsers = isSuperAdmin || isAdmin;
  const canEditPhoneNumbers = isSuperAdmin || isAdmin;
  const canViewMemberSettings = isSuperAdmin || isAdmin;

  // Specific permissions for members
  const canViewMembers = isSuperAdmin || isAdmin; // Only admins can see members screen
  const canScheduleMeetings = isSuperAdmin || isAdmin; // Only admins can schedule meetings
  const canDeleteMeetings = isSuperAdmin || isAdmin; // Only admins can delete meetings
  const canEditVoting = isSuperAdmin || isAdmin; // Only admins can edit active voting
  const canCreateVoting = isSuperAdmin || isAdmin; // Only admins can create voting
  const canVoteOnly = userRole === 'member'; // Members can only vote
  const canMarkAttendanceOnly = userRole === 'member'; // Members can only mark attendance

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
    canMarkAttendanceOnly
  };
};
