
import { supabase } from '@/integrations/supabase/client';

export class DatabaseSetupError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseSetupError';
  }
}

type ValidRole = 'super_admin' | 'admin' | 'member' | 'secretary' | 'treasurer';

const isValidRole = (role: string): role is ValidRole => {
  return ['super_admin', 'admin', 'member', 'secretary', 'treasurer'].includes(role);
};

export const checkDatabaseConfiguration = async () => {
  try {
    console.log('Checking database configuration...');
    
    // Check if profiles table exists and is accessible
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.error('Profiles table check failed:', profilesError);
      throw new DatabaseSetupError('Profiles table is not properly configured', profilesError);
    }

    // Check if user_roles table exists and is accessible
    const { data: rolesCheck, error: rolesError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (rolesError) {
      console.error('User roles table check failed:', rolesError);
      throw new DatabaseSetupError('User roles table is not properly configured', rolesError);
    }

    console.log('Database configuration check passed');
    return true;
  } catch (error) {
    console.error('Database configuration check failed:', error);
    throw error;
  }
};

export const ensureUserProfile = async (userId: string, userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => {
  try {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('Profile already exists, updating...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw new DatabaseSetupError('Failed to update existing profile', updateError);
      }
    } else {
      console.log('Creating new profile...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || ''
        });

      if (insertError) {
        throw new DatabaseSetupError('Failed to create new profile', insertError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
};

export const ensureUserRole = async (userId: string, role: string) => {
  try {
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .single();

    if (!existingRole) {
      console.log('Creating user role...');
      
      // Validate role before assignment
      if (!isValidRole(role)) {
        throw new DatabaseSetupError(`Invalid role: ${role}. Must be one of: super_admin, admin, member, secretary, treasurer`);
      }
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (roleError) {
        throw new DatabaseSetupError('Failed to assign user role', roleError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error ensuring user role:', error);
    throw error;
  }
};
