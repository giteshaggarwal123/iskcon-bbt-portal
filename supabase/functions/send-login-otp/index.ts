
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

// Function to mask phone number for display
const maskPhoneNumber = (phone: string): string => {
  const formatted = formatPhoneNumber(phone);
  if (formatted.startsWith('+91') && formatted.length === 13) {
    return formatted.replace(/(\+91)(\d{2})(\d{3})(\d{5})/, '$1**$3***$4');
  }
  return formatted.replace(/(\+\d{1,3})(\d{2,3})(\d{3,4})(\d{4})/, '$1**$3***$4');
};

// Generate secure 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      console.error('Missing email parameter');
      return new Response(
        JSON.stringify({ 
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          code: 'CONFIG_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Looking for user with email:', email);

    // Get user's phone number and name from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, first_name, last_name')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'User not found in the system',
          details: 'This email address is not registered as a bureau member. Please contact the administrator to get added to the system.',
          code: 'USER_NOT_FOUND'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile || !profile.phone) {
      console.error('No phone number for user:', email);
      return new Response(
        JSON.stringify({ 
          error: 'Phone number not registered',
          details: 'Your account does not have a registered phone number. Please contact the administrator to add your phone number to your profile before using OTP login.',
          code: 'NO_PHONE'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the phone number properly
    const formattedPhone = formatPhoneNumber(profile.phone);
    const maskedPhone = maskPhoneNumber(profile.phone);
    console.log('Original phone:', profile.phone, 'Formatted phone:', formattedPhone);

    // Generate 6-digit OTP
    const otp = generateOTP();
    
    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio configuration');
      return new Response(
        JSON.stringify({ 
          error: 'SMS service not configured',
          details: 'The SMS service is temporarily unavailable. Please contact the administrator or try again later.',
          code: 'SMS_CONFIG_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create personalized greeting
    const firstName = profile.first_name || '';
    const greeting = firstName ? `Hi ${firstName}` : 'Hello';

    // Personalized message format
    const smsBody = `${greeting}, your ISKCON Bureau login code is ${otp}. Valid for 5 minutes. Do not share this code.`;

    // Send SMS via Twilio with retry mechanism
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`SMS attempt ${attempts}/${maxAttempts} to ${formattedPhone}`);

      try {
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

        if (response.ok) {
          const responseData = await response.json();
          console.log('SMS sent successfully:', responseData.sid);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Verification code sent to ${maskedPhone}`,
              maskedPhone: maskedPhone,
              otp: otp // In production, store this securely instead of returning it
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const errorData = await response.text();
          console.error(`Twilio error on attempt ${attempts}:`, errorData);
          lastError = errorData;

          // Parse specific Twilio errors
          if (errorData.includes('20003')) {
            return new Response(
              JSON.stringify({ 
                error: 'SMS authentication failed',
                details: 'SMS service authentication error. Please contact the administrator.',
                code: 'SMS_AUTH_ERROR'
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (errorData.includes('21211') || errorData.includes('21614')) {
            return new Response(
              JSON.stringify({ 
                error: 'Invalid phone number',
                details: 'Your registered phone number format is invalid. Please contact the administrator to update your phone number.',
                code: 'INVALID_PHONE'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // If not the last attempt, wait before retry
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      } catch (fetchError) {
        console.error(`Network error on attempt ${attempts}:`, fetchError);
        lastError = fetchError.message;
        
        // If not the last attempt, wait before retry
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    // All attempts failed
    console.error('All SMS attempts failed:', lastError);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send verification code',
        details: 'Unable to send SMS after multiple attempts. Please check your phone number or try again later.',
        code: 'SMS_SEND_FAILED'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in send-login-otp function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'An unexpected error occurred. Please try again later.',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
