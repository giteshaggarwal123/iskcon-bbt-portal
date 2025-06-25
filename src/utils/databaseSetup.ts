
import { supabase } from '@/integrations/supabase/client';

type ValidRole = 'super_admin' | 'admin' | 'member' | 'secretary' | 'treasurer';

const isValidRole = (role: string): role is ValidRole => {
  return ['super_admin', 'admin', 'member', 'secretary', 'treasurer'].includes(role);
};

export const ensureAdminExists = async () => {
  try {
    console.log('Checking for existing admin users...');
    
    // Check if any admin users exist by joining profiles with user_roles
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        first_name,
        last_name,
        user_roles!inner(role)
      `)
      .in('user_roles.role', ['super_admin', 'admin']);

    if (adminError) {
      console.error('Error checking for admin users:', adminError);
      return;
    }

    if (admins && admins.length > 0) {
      console.log('Admin users found:', admins.length);
      return;
    }

    console.log('No admin users found, creating default admin...');

    // Create a default admin user
    const defaultAdmin = {
      email: 'admin@iskconbureau.in',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'super_admin'
    };

    // Validate role before insertion
    if (!isValidRole(defaultAdmin.role)) {
      console.error('Invalid role for default admin');
      return;
    }

    // Step 1: Create profile
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        email: defaultAdmin.email,
        first_name: defaultAdmin.first_name,
        last_name: defaultAdmin.last_name,
      })
      .select()
      .single();

    if (createProfileError) {
      console.error('Error creating default admin profile:', createProfileError);
      return;
    }

    // Step 2: Create user role
    const { error: createRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newProfile.id,
        role: defaultAdmin.role as ValidRole,
      });

    if (createRoleError) {
      console.error('Error creating default admin role:', createRoleError);
      // Clean up profile if role creation fails
      await supabase.from('profiles').delete().eq('id', newProfile.id);
      return;
    }

    console.log('Default admin created successfully:', newProfile);

  } catch (error) {
    console.error('Error in ensureAdminExists:', error);
  }
};

export const setupDatabase = async () => {
  console.log('Setting up database...');
  
  try {
    // Ensure admin exists
    await ensureAdminExists();
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
};
