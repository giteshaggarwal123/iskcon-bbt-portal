
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Shared OTP store with verify-otp function - using consistent key format
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number; lastSent: number }>();

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
const checkRateLimit = (phoneNumber: string): boolean => {
  const now = Date.now();
  const key = `rate_limit_${phoneNumber}`;
  const rateLimit = rateLimitStore.get(key);
  
  if (!rateLimit || now > rateLimit.resetTime) {
    // Reset rate limit every 5 minutes
    rateLimitStore.set(key, { count: 1, resetTime: now + 5 * 60 * 1000 });
    return true;
  }
  
  if (rateLimit.count >= 3) {
    return false; // Too many requests
  }
  
  rateLimit.count++;
  return true;
};

// Check if OTP was recently sent (prevent duplicates within 60 seconds)
const checkRecentOTP = (phoneNumber: string): boolean => {
  const key = `reset_${phoneNumber}`;
  const storedOTP = otpStore.get(key);
  
  if (storedOTP && storedOTP.lastSent) {
    const timeSinceLastSent = Date.now() - storedOTP.lastSent;
    return timeSinceLastSent < 60000; // 60 seconds
  }
  
  return false;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(phoneNumber)) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many OTP requests. Please wait 5 minutes before trying again.',
          details: 'Rate limit exceeded.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if OTP was recently sent
    if (checkRecentOTP(phoneNumber)) {
      return new Response(
        JSON.stringify({ 
          error: 'OTP was recently sent. Please wait 60 seconds before requesting again.',
          details: 'Duplicate request prevention.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    
    // Store OTP with consistent key format: reset_{phoneNumber}
    const key = `reset_${phoneNumber}`;
    otpStore.set(key, {
      otp,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      lastSent: now
    });
    
    console.log(`Storing reset OTP for key: ${key}, OTP: ${otp}`);
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: phoneNumber,
        Body: `Your ISKCON Bureau password reset OTP is: ${otp}. This code will expire in 10 minutes.`
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      
      // Remove OTP from store if SMS failed
      otpStore.delete(key);
      
      return new Response(
        JSON.stringify({ error: 'Failed to send OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Reset OTP sent successfully to:', phoneNumber);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        cooldown: 60 // Tell frontend to wait 60 seconds before allowing another request
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
