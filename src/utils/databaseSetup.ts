
import { supabase } from '@/integrations/supabase/client';

type ValidRole = 'super_admin' | 'admin' | 'member' | 'secretary' | 'treasurer';

const isValidRole = (role: string): role is ValidRole => {
  return ['super_admin', 'admin', 'member', 'secretary', 'treasurer'].includes(role);
};

export const ensureAdminExists = async () => {
  try {
    console.log('Checking for existing admin users...');
    
    // Check if any admin users exist
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('role', ['super_admin', 'admin']);

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
      full_name: 'System Administrator',
      role: 'super_admin'
    };

    // Validate role before insertion
    if (!isValidRole(defaultAdmin.role)) {
      console.error('Invalid role for default admin');
      return;
    }

    const { data: newAdmin, error: createError } = await supabase
      .from('profiles')
      .insert({
        email: defaultAdmin.email,
        full_name: defaultAdmin.full_name,
        role: defaultAdmin.role as ValidRole, // Now TypeScript knows this is a valid role
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating default admin:', createError);
      return;
    }

    console.log('Default admin created successfully:', newAdmin);

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
