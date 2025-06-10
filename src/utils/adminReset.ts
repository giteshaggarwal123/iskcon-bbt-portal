
import { supabase } from '@/integrations/supabase/client';

export const resetUserPassword = async (email: string, newPassword: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: {
        email: email,
        type: 'admin_reset',
        newPassword: newPassword,
        adminReset: true
      }
    });

    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }

    console.log('Password reset successful:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Password reset failed:', error);
    return { success: false, error: error.message };
  }
};

// Immediately reset the password for anshkashyap23109@gmail.com
resetUserPassword('anshkashyap23109@gmail.com', '12345678').then(result => {
  if (result.success) {
    console.log('✅ Password reset successful for anshkashyap23109@gmail.com');
  } else {
    console.error('❌ Password reset failed:', result.error);
  }
});
