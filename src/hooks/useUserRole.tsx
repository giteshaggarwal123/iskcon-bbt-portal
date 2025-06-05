src/
├─ lib/
│   └─ authService.ts   /* ────────────────────────────────────────────────────────────
   authService.ts
   All auth helpers live here
   ──────────────────────────────────────────────────────────── */

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''; // only needed for seeding

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type SignInResult = { user: User };

/* ── public: email + password sign-in ──────────────────────── */
export async function signInWithEmail(
  rawEmail: string,
  password: string,
): Promise<SignInResult> {
  const email = rawEmail.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Normalise common errors to a friendlier message
    if (error.status === 400) {
      throw new Error('Incorrect email or password.');
    }
    throw error;
  }

  return { user: data.user! };
}

/* ── one-off helper: seed the very first admin ─────────────── */
export async function seedInitialAdmin() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY missing – cannot seed admin automatically.',
    );
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Create the auth user (email is auto-confirmed).
  const { data: createRes, error: createErr } =
    await adminClient.auth.admin.createUser({
      email: 'admin@iskconbureau.in',
      password: 'ChangeThisStrongPwd!',
      email_confirm: true,
    });

  if (createErr && createErr.status !== 409) {
    // 409 = already exists – ignore in that case
    throw createErr;
  }

  const adminId =
    createRes?.user?.id ??
    (
      await adminClient
        .from('auth.users')
        .select('id')
        .eq('email', 'admin@iskconbureau.in')
        .single()
    ).data.id;

  // 2. Ensure the role row exists.
  await adminClient.from('user_roles').upsert(
    {
      user_id: adminId,
      role: 'super_admin',
    },
    { onConflict: 'user_id' },
  );

  console.log('✅ Admin seeded & role set');
}

└─ hooks/
    └─ useUserRole.ts   /* ────────────────────────────────────────────────────────────
   useUserRole.ts
   Reliable role hook – no accidental super-admins
   ──────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import { supabase } from './authService';      // ← import from the file above
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

/* ── config ───────────────────────────────────────────────── */
const SUPER_ADMIN_EMAILS = ['cs@iskconbureau.in', 'admin@iskconbureau.in'].map(
  (e) => e.trim().toLowerCase(),
);

/* ── hook ─────────────────────────────────────────────────── */
export const useUserRole = (): UseUserRoleReturn => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // must give current session user

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        /* 1. Pull role from DB */
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        let role: UserRole | null =
          error || !data ? null : (data.role as UserRole);

        const email = (user.email ?? '').trim().toLowerCase();
        const whitelisted = SUPER_ADMIN_EMAILS.includes(email);

        /* 2. Promote whitelisted e-mails if DB role ≠ super_admin */
        if (whitelisted && role !== 'super_admin') role = 'super_admin';

        /* 3. Demote rogue super_admin rows */
        if (role === 'super_admin' && !whitelisted) role = 'member';

        /* 4. Default */
        if (!role) role = 'member';

        setUserRole(role);
      } catch {
        setUserRole('member');
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

  /* permissions */
  const canManageMembers = isSuperAdmin || isAdmin;
  const canManageMeetings = isSuperAdmin || isAdmin || isSecretary;
  const canManageDocuments = isSuperAdmin || isAdmin || isSecretary;
  const canViewReports = isSuperAdmin || isAdmin || isTreasurer;
  const canManageSettings = true;
  const canCreateContent = isSuperAdmin || isAdmin || isSecretary;
  const canDeleteContent = isSuperAdmin || isAdmin;
  const canEditContent = isSuperAdmin || isAdmin || isSecretary;

  const canEditAllUserInfo = isSuperAdmin;
  const canEditUserRoles = isSuperAdmin || isAdmin;
  const canDeleteUsers = isSuperAdmin || isAdmin;
  const canEditPhoneNumbers = isSuperAdmin || isAdmin;
  const canViewMemberSettings = isSuperAdmin || isAdmin || isSecretary;

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

