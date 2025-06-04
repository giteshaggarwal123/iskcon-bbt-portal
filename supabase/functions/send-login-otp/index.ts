
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to format phone number to international format
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 91 (India country code), add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '+91' + cleaned;
  }
  
  // If it already has + at the beginning, use as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: assume it's an Indian number and add +91
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Looking for user with email:', email);

    // Get user's phone number from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, first_name, last_name')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'User not found. Please ensure the member has been properly added to the system.',
          details: 'The email address is not registered in our system or the profile data is incomplete.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.error('No profile found for email:', email);
      return new Response(
        JSON.stringify({ 
          error: 'User profile not found. Please contact the administrator.',
          details: 'This user exists in authentication but not in the profiles table.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.phone) {
      console.error('No phone number for user:', email);
      return new Response(
        JSON.stringify({ 
          error: 'Phone number not registered. Please contact the administrator to update your phone number.',
          details: 'OTP can only be sent to registered mobile numbers.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the phone number properly
    const formattedPhone = formatPhoneNumber(profile.phone);
    console.log('Original phone:', profile.phone, 'Formatted phone:', formattedPhone);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'SMS service not configured. Please contact the administrator.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS via Twilio
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
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send verification code. Please check if your phone number is correct or contact the administrator.',
          details: 'SMS delivery failed. This could be due to network issues or invalid phone number format.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login OTP sent successfully to:', formattedPhone, 'for email:', email);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Verification code sent to ${formattedPhone.replace(/(\+91)(\d{5})(\d{5})/, '$1*****$3')}`,
        otp: otp // In production, store this securely instead of returning it
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-login-otp function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please try again later.',
        details: 'An unexpected error occurred while processing your request.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
