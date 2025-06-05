// -----------------------------------------------------------------------------
// authAndRole.ts  –  Supabase client, sign-in helper, optional admin seeder,
//                    and the useUserRole() React hook in one place.
// -----------------------------------------------------------------------------

import { createClient, User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';      // keep this if you already have useAuth()

// 1. Supabase client -----------------------------------------------------------
const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL  as string;
const SUPABASE_ANON_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
export const supabase    = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Auth helpers --------------------------------------------------------------
export async function signInWithEmail(rawEmail: string, password: string): Promise<User> {
  const email = rawEmail.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message || 'Incorrect email or password.');
  }
  return data.user;
}

/* Optional – run ONCE on the server to create the very first admin user */
export async function seedInitialAdmin() {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  const adminEmail = 'admin@iskconbureau.in';
  const adminPwd   = 'ChangeThisStrongPwd!'; // change after first login

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: adminPwd,
    email_confirm: true,
  });
  if (createErr && createErr.status !== 409) throw createErr;

  const adminId =
    created?.user?.id ??
    (
      await adminClient
        .from('auth.users')
        .select('id')
        .eq('email', adminEmail)
        .single()
    ).data.id;

  await adminClient
    .from('user_roles')
    .upsert({ user_id: adminId, role: 'super_admin' }, { onConflict: 'user_id' });
  console.log('Initial admin seeded');
}

// 3. Role & permissions --------------------------------------------------------
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'secretary'
  | 'treasurer'
  | 'member';

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

// only these e-mails can be super_admin
const SUPER_ADMIN_EMAILS = ['cs@iskconbureau.in', 'admin@iskconbureau.in'];

// 4. React hook ----------------------------------------------------------------
export function useUserRole(): UseUserRoleReturn {
  /* If you already have a separate useAuth() hook, keep using it.
     Otherwise you can replace the next line with
     `const { data: { user } } = supabase.auth.getSession();`
  */
  const { user } = useAuth();

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading,  setLoading ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user) {
        if (!cancelled) {
          setUserRole(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        let role: UserRole | null = error || !data ? null : (data.role as UserRole);

        const email      = (user.email || '').trim().toLowerCase();
        const whitelisted = SUPER_ADMIN_EMAILS.includes(email);

        if (whitelisted && role !== 'super_admin') role = 'super_admin';
        if (role === 'super_admin' && !whitelisted)  role = 'member';
        if (!role) role = 'member';

        if (!cancelled) setUserRole(role);
      } catch {
        if (!cancelled) setUserRole('member');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRole();
    return () => { cancelled = true; };
  }, [user?.id]);

  // helpers
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin      = userRole === 'admin' || isSuperAdmin;
  const isSecretary  = userRole === 'secretary' || isAdmin;
  const isTreasurer  = userRole === 'treasurer' || isAdmin;
  const isMember     =
    userRole === 'member' || isSecretary || isTreasurer || isAdmin || isSuperAdmin;

  // permissions
  const canManageMembers       = isSuperAdmin || isAdmin;
  const canManageMeetings      = isSuperAdmin || isAdmin || isSecretary;
  const canManageDocuments     = isSuperAdmin || isAdmin || isSecretary;
  const canViewReports         = isSuperAdmin || isAdmin || isTreasurer;
  const canManageSettings      = true;
  const canCreateContent       = isSuperAdmin || isAdmin || isSecretary;
  const canDeleteContent       = isSuperAdmin || isAdmin;
  const canEditContent         = isSuperAdmin || isAdmin || isSecretary;
  const canEditAllUserInfo     = isSuperAdmin;
  const canEditUserRoles       = isSuperAdmin || isAdmin;
  const canDeleteUsers         = isSuperAdmin || isAdmin;
  const canEditPhoneNumbers    = isSuperAdmin || isAdmin;
  const canViewMemberSettings  = isSuperAdmin || isAdmin || isSecretary;

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
}
