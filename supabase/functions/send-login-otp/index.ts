
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

// Function to send SMS with retry logic
const sendSMSWithRetry = async (
  twilioUrl: string,
  credentials: string,
  twilioPhoneNumber: string,
  formattedPhone: string,
  smsBody: string,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: any }> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`SMS attempt ${attempt}/${maxRetries} to ${formattedPhone}`);
      
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

      const responseText = await response.text();
      
      if (response.ok) {
        const responseData = JSON.parse(responseText);
        console.log(`SMS sent successfully on attempt ${attempt}:`, responseData.sid);
        return { success: true, data: responseData };
      } else {
        console.error(`Twilio error on attempt ${attempt}:`, responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }

        // If it's a permanent error (auth, config, etc.), don't retry
        if (errorData.code === 20003 || errorData.code === 21211 || errorData.code === 21614 || errorData.code === 21608) {
          console.log(`Permanent error detected (${errorData.code}), not retrying`);
          return { success: false, error: errorData };
        }

        // If it's the last attempt, return the error
        if (attempt === maxRetries) {
          return { success: false, error: errorData };
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (fetchError) {
      console.error(`Network error on attempt ${attempt}:`, fetchError);
      
      // If it's the last attempt, return the network error
      if (attempt === maxRetries) {
        return { success: false, error: { code: 'NETWORK_ERROR', message: fetchError.message } };
      }

      // Wait before retrying
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return { success: false, error: { code: 'MAX_RETRIES_EXCEEDED', message: 'All retry attempts failed' } };
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
          details: 'Please provide a valid email address.',
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
          error: 'Service temporarily unavailable',
          details: 'Server configuration error. Please try again later or contact support.',
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

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Account not found',
          details: 'This email is not registered in our system. Please contact your administrator to get access.',
          code: 'USER_NOT_FOUND'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.phone) {
      console.error('No phone number for user:', email);
      return new Response(
        JSON.stringify({ 
          error: 'Phone number required',
          details: 'Your account does not have a registered phone number. Please contact support to add your phone number.',
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
    
    // Get Twilio credentials with enhanced validation
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio configuration');
      return new Response(
        JSON.stringify({ 
          error: 'SMS service unavailable',
          details: 'SMS service is not configured. Please contact support.',
          code: 'SMS_CONFIG_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced Twilio credentials validation
    if (!twilioAccountSid.startsWith('AC') || twilioAccountSid.length !== 34) {
      console.error('Invalid Twilio Account SID format');
      return new Response(
        JSON.stringify({ 
          error: 'SMS configuration error',
          details: 'SMS service is not properly configured. Please contact support.',
          code: 'INVALID_TWILIO_CONFIG'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (twilioAuthToken.length < 32) {
      console.error('Invalid Twilio Auth Token format');
      return new Response(
        JSON.stringify({ 
          error: 'SMS authentication error',
          details: 'SMS service authentication is not properly configured. Please contact support.',
          code: 'INVALID_TWILIO_AUTH'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!twilioPhoneNumber.startsWith('+')) {
      console.error('Invalid Twilio Phone Number format');
      return new Response(
        JSON.stringify({ 
          error: 'SMS service phone error',
          details: 'SMS service phone number is not properly configured. Please contact support.',
          code: 'INVALID_TWILIO_PHONE'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create personalized greeting
    const firstName = profile.first_name || '';
    const greeting = firstName ? `Hi ${firstName}` : 'Hello';
    const smsBody = `${greeting}, your ISKCON Bureau login code is ${otp}. Valid for 5 minutes. Do not share this code.`;

    // Send SMS via Twilio with retry logic
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const smsResult = await sendSMSWithRetry(
      twilioUrl,
      credentials,
      twilioPhoneNumber,
      formattedPhone,
      smsBody
    );

    if (smsResult.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Verification code sent to ${maskedPhone}`,
          maskedPhone: maskedPhone,
          otp: otp // Remove this in production - store securely instead
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const error = smsResult.error;
      
      // Handle specific Twilio error codes with better messaging
      if (error.code === 20003) {
        return new Response(
          JSON.stringify({ 
            error: 'SMS authentication failed',
            details: 'SMS service authentication error. Please contact the administrator to verify Twilio credentials.',
            code: 'TWILIO_AUTH_ERROR'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.code === 21211 || error.code === 21614) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid phone number',
            details: 'Your registered phone number appears to be invalid. Please contact support to update it.',
            code: 'INVALID_PHONE'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.code === 21608) {
        return new Response(
          JSON.stringify({ 
            error: 'Phone number not verified',
            details: 'Unable to send SMS to unverified number. Please contact support.',
            code: 'UNVERIFIED_PHONE'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.code === 'NETWORK_ERROR') {
        return new Response(
          JSON.stringify({ 
            error: 'Network error',
            details: 'Unable to connect to SMS service. Please check your internet connection and try again.',
            code: 'NETWORK_ERROR'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Unable to send verification code',
            details: 'SMS service is temporarily unavailable. Please try again later or contact support.',
            code: 'SMS_SEND_FAILED',
            twilioError: error
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error) {
    console.error('Unexpected error in send-login-otp function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Service temporarily unavailable',
        details: 'An unexpected error occurred. Please try again in a few minutes or contact support.',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
