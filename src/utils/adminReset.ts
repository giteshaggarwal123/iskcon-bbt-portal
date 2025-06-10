
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

export const confirmUserEmail = async (email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: {
        email: email,
        type: 'confirm_email'
      }
    });

    if (error) {
      console.error('Email confirmation error:', error);
      throw error;
    }

    console.log('Email confirmation successful:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Email confirmation failed:', error);
    return { success: false, error: error.message };
  }
};

// Confirm email for anshkashyap23109@gmail.com
confirmUserEmail('anshkashyap23109@gmail.com').then(result => {
  if (result.success) {
    console.log('✅ Email confirmed for anshkashyap23109@gmail.com');
    
    // After confirming email, reset the password
    return resetUserPassword('anshkashyap23109@gmail.com', '12345678');
  } else {
    console.error('❌ Email confirmation failed:', result.error);
    return Promise.reject(result.error);
  }
}).then(resetResult => {
  if (resetResult && resetResult.success) {
    console.log('✅ Password reset successful for anshkashyap23109@gmail.com');
  } else {
    console.error('❌ Password reset failed:', resetResult?.error);
  }
}).catch(error => {
  console.error('❌ Process failed:', error);
});
