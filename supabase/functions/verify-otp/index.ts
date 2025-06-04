
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory OTP store (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type } = await req.json();

    if (!email || !otp || !type) {
      return new Response(
        JSON.stringify({ error: 'Email, OTP, and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const key = `${type}_${email}`;
    const storedOTP = otpStore.get(key);

    if (!storedOTP) {
      return new Response(
        JSON.stringify({ error: 'OTP not found or expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts limit (max 3 attempts)
    if (storedOTP.attempts >= 3) {
      otpStore.delete(key);
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(key);
      return new Response(
        JSON.stringify({ error: 'OTP has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      return new Response(
        JSON.stringify({ 
          error: 'Invalid OTP',
          attemptsRemaining: 3 - storedOTP.attempts
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP verified successfully
    otpStore.delete(key);

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

// Export the OTP store for use by other functions
export { otpStore };
