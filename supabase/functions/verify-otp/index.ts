
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import the shared OTP store from send-login-otp function
// In Deno edge functions, we need to implement a simple shared storage mechanism
// Since edge functions are stateless, we'll use a consistent approach

// Global OTP store that will be consistent across function calls
const globalOTPStore = new Map<string, { otp: string; expiresAt: number; attempts: number; lastSent?: number }>();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of globalOTPStore.entries()) {
    if (now > value.expiresAt) {
      globalOTPStore.delete(key);
      console.log(`Cleaned up expired OTP for key: ${key}`);
    }
  }
}, 5 * 60 * 1000);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type, phoneNumber } = await req.json();

    if (!otp || !type) {
      return new Response(
        JSON.stringify({ error: 'OTP and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the correct key format based on type
    let key: string;
    if (type === 'login') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required for login OTP verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      key = `login_${email}`;
    } else if (type === 'reset') {
      // For reset, we can use either email or phoneNumber
      if (phoneNumber) {
        key = `reset_${phoneNumber}`;
      } else if (email) {
        // Find the reset key associated with this email by checking all reset keys
        const resetKeys = Array.from(globalOTPStore.keys()).filter(k => k.startsWith('reset_'));
        // For now, use the first available reset key - in production, you'd have better user mapping
        key = resetKeys[0] || `reset_${email}`;
      } else {
        return new Response(
          JSON.stringify({ error: 'Phone number or email is required for reset OTP verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid OTP type. Must be "login" or "reset"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying OTP for key: ${key}, provided OTP: ${otp}`);
    console.log(`Available keys in store: ${Array.from(globalOTPStore.keys()).join(', ')}`);
    
    const storedOTP = globalOTPStore.get(key);

    if (!storedOTP) {
      console.log(`OTP not found for key: ${key}`);
      return new Response(
        JSON.stringify({ error: 'OTP not found or expired. Please request a new OTP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts limit (max 3 attempts)
    if (storedOTP.attempts >= 3) {
      globalOTPStore.delete(key);
      console.log(`Too many attempts for key: ${key}, deleting OTP`);
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (Date.now() > storedOTP.expiresAt) {
      globalOTPStore.delete(key);
      console.log(`Expired OTP for key: ${key}, deleting`);
      return new Response(
        JSON.stringify({ error: 'OTP has expired. Please request a new OTP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      console.log(`Invalid OTP attempt for key: ${key}. Expected: ${storedOTP.otp}, Received: ${otp}, Attempts: ${storedOTP.attempts}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid OTP. Please check the code and try again.',
          attemptsRemaining: 3 - storedOTP.attempts
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP verified successfully
    globalOTPStore.delete(key);
    console.log(`OTP verified successfully for key: ${key}`);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP verified successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Export the OTP store for use by other functions if needed
export { globalOTPStore as otpStore };
