
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine the correct identifier based on type
    let identifier: string;
    if (type === 'login') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required for login OTP verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      identifier = email;
    } else if (type === 'reset') {
      if (!phoneNumber && !email) {
        return new Response(
          JSON.stringify({ error: 'Phone number or email is required for reset OTP verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      identifier = phoneNumber || email;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid OTP type. Must be "login" or "reset"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying OTP for identifier: ${identifier}, type: ${type}, provided OTP: ${otp}`);

    // Get OTP from database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('identifier', identifier)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.log(`OTP not found for identifier: ${identifier}, type: ${type}. Error:`, fetchError);
      return new Response(
        JSON.stringify({ error: 'OTP not found or expired. Please request a new OTP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found OTP record: ${JSON.stringify(otpRecord)}`);

    // Check attempts limit (max 3 attempts)
    if (otpRecord.attempts >= 3) {
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', otpRecord.id);
      console.log(`Too many attempts for identifier: ${identifier}, deleting OTP`);
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', otpRecord.id);
      console.log(`Expired OTP for identifier: ${identifier}, deleting`);
      return new Response(
        JSON.stringify({ error: 'OTP has expired. Please request a new OTP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      // Increment attempts
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      
      console.log(`Invalid OTP attempt for identifier: ${identifier}. Expected: ${otpRecord.otp_code}, Received: ${otp}, Attempts: ${otpRecord.attempts + 1}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid OTP. Please check the code and try again.',
          attemptsRemaining: 3 - (otpRecord.attempts + 1)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP verified successfully - delete it
    await supabase
      .from('otp_codes')
      .delete()
      .eq('id', otpRecord.id);
    
    console.log(`OTP verified successfully for identifier: ${identifier}`);

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
