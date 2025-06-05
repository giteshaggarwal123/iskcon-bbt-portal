
/* ────────────────────────────────────────────────────────────
   useUserRole.ts
   Correct role detection without accidental super-admin grants
   ──────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/* ── role type ─────────────────────────────────────────────── */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'secretary'
  | 'treasurer'
  | 'member';

/* ── return type ───────────────────────────────────────────── */

interface UseUserRoleReturn {
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSecretary: boolean;
  isTreasurer: boolean;
  isMember: boolean;
  loading: boolean;

  /* permissions */
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

/* ── configuration ─────────────────────────────────────────── */

const SUPER_ADMIN_EMAILS: string[] = [
  'cs@iskconbureau.in',
  'admin@iskconbureau.in',
].map((email) => email.trim().toLowerCase());

/* ── hook ──────────────────────────────────────────────────── */

export const useUserRole = (): UseUserRoleReturn => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth(); // always returns current session user

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        /* fetch role from DB */
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        let role: UserRole | null =
          error || !data ? null : (data.role as UserRole);

        const email = (user.email ?? '').trim().toLowerCase();
        const isWhitelisted = SUPER_ADMIN_EMAILS.includes(email);

        /* promote whitelisted emails if needed */
        if (isWhitelisted && role !== 'super_admin') {
          role = 'super_admin';
        }

        /* demote any stray super_admin not on the list */
        if (role === 'super_admin' && !isWhitelisted) {
          role = 'member';
        }

        /* default to member if still null */
        if (!role) {
          role = 'member';
        }

        setUserRole(role);
      } catch (err) {
        setUserRole('member'); // fail-safe
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  /* helpers */

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isSecretary = userRole === 'secretary' || isAdmin;
  const isTreasurer = userRole === 'treasurer' || isAdmin;
  const isMember =
    userRole === 'member' ||
    isSecretary ||
    isTreasurer ||
    isAdmin ||
    isSuperAdmin;

  /* permission matrix */

  const canManageMembers = isSuperAdmin || isAdmin;
  const canManageMeetings = isSuperAdmin || isAdmin || isSecretary;
  const canManageDocuments = isSuperAdmin || isAdmin || isSecretary;
  const canViewReports = isSuperAdmin || isAdmin || isTreasurer;
  const canManageSettings = true; // all roles
  const canCreateContent = isSuperAdmin || isAdmin || isSecretary;
  const canDeleteContent = isSuperAdmin || isAdmin;
  const canEditContent = isSuperAdmin || isAdmin || isSecretary;

  const canEditAllUserInfo = isSuperAdmin;
  const canEditUserRoles = isSuperAdmin || isAdmin;
  const canDeleteUsers = isSuperAdmin || isAdmin;
  const canEditPhoneNumbers = isSuperAdmin || isAdmin;
  const canViewMemberSettings = isSuperAdmin || isAdmin || isSecretary;

  /* return */

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
  };
};
