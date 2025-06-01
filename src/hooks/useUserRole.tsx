
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

  // Permission calculations - everyone can view, but editing/deleting is restricted
  const canManageMembers = isSuperAdmin || isAdmin;
  const canManageMeetings = isSuperAdmin || isAdmin || isSecretary;
  const canManageDocuments = isSuperAdmin || isAdmin || isSecretary;
  const canViewReports = isSuperAdmin || isAdmin || isTreasurer;
  const canManageSettings = isSuperAdmin || isAdmin;
  
  // New granular permissions
  const canCreateContent = isSuperAdmin || isAdmin || isSecretary;
  const canDeleteContent = isSuperAdmin || isAdmin;
  const canEditContent = isSuperAdmin || isAdmin || isSecretary;

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
    canEditContent
  };
};
