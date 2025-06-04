
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to format phone number to international format
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '+91' + cleaned;
  }
  
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return '+91' + cleaned;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Looking for user with email:', email);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, first_name, last_name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ 
          error: 'User not found in the system.',
          details: 'This email address is not registered as a bureau member.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.phone) {
      return new Response(
        JSON.stringify({ 
          error: 'Phone number not registered.',
          details: 'Your account does not have a registered phone number.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for recent OTP (within 60 seconds)
    const { data: recentOtp } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('identifier', email)
      .eq('type', 'login')
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .single();

    if (recentOtp) {
      return new Response(
        JSON.stringify({ 
          error: 'OTP was recently sent. Please wait 60 seconds before requesting again.',
          details: 'Duplicate request prevention.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(profile.phone);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this email and type
    await supabase
      .from('otp_codes')
      .delete()
      .eq('identifier', email)
      .eq('type', 'login');

    // Store new OTP in database
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        identifier: email,
        otp_code: otp,
        type: 'login',
        expires_at: expiresAt.toISOString(),
        attempts: 0
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Stored login OTP in database for email: ${email}, OTP: ${otp}`);

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'SMS service not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const smsBody = `Hello ${userName}, your ISKCON Bureau login verification code is: ${otp}. This code will expire in 5 minutes.`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: formattedPhone,
        Body: smsBody
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      
      // Remove OTP from database if SMS failed
      await supabase
        .from('otp_codes')
        .delete()
        .eq('identifier', email)
        .eq('type', 'login');
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send verification code.',
          details: 'Unable to send SMS to your registered phone number.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login OTP sent successfully to:', formattedPhone, 'for email:', email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Verification code sent to ${formattedPhone.replace(/(\+91)(\d{5})(\d{5})/, '$1*****$3')}`,
        cooldown: 60
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-login-otp function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error.',
        details: 'An unexpected error occurred.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
