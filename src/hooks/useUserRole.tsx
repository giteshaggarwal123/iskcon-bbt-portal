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

  // Basic permissions
  const canManageMembers = isSuperAdmin || isAdmin;
  const canManageMeetings = isSuperAdmin || isAdmin || isSecretary;
  const canManageDocuments = isSuperAdmin || isAdmin || isSecretary;
  const canViewReports = isSuperAdmin || isAdmin || isTreasurer;
  const canManageSettings = true; // All members can access settings
  
  // Content permissions
  const canCreateContent = isSuperAdmin || isAdmin || isSecretary;
  const canDeleteContent = isSuperAdmin || isAdmin;
  const canEditContent = isSuperAdmin || isAdmin || isSecretary;

  // Enhanced user management permissions
  const canEditAllUserInfo = isSuperAdmin; // Only super admin can edit names, etc.
  const canEditUserRoles = isSuperAdmin || isAdmin; // Admins can edit roles but not super admin roles
  const canDeleteUsers = isSuperAdmin || isAdmin; // Admins can delete users but not super admins
  const canEditPhoneNumbers = isSuperAdmin || isAdmin; // Phone numbers can be edited by admins+
  const canViewMemberSettings = isSuperAdmin || isAdmin || isSecretary; // Settings access

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
    canViewMemberSettings
  };
};
