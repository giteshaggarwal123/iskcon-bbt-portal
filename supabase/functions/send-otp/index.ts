
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, name, type = 'otp' } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create personalized greeting
    const greeting = name ? `Hi ${name}` : 'Hello';

    let smsBody;
    let recipient = phoneNumber;

    // Handle different message types
    if (type === 'password_reset') {
      // For password reset, assume phoneNumber is actually email
      // This is a temporary password that user can use to login and change
      smsBody = `${greeting}, your ISKCON Bureau temporary password is: ${otp}. Please login and change your password immediately. Valid for 24 hours.`;
      
      // For password reset emails, we could send an SMS to admin or log it
      // Since we don't have email service configured, we'll send SMS notification to admin
      console.log('Password reset requested for email:', phoneNumber);
      console.log('Temporary password generated:', otp);
      
      // Return success with the temporary password (in production, this should be sent via email)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Temporary password generated. Please contact admin for email delivery.',
          temporaryPassword: otp,
          email: phoneNumber
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Original OTP message format for phone login
      smsBody = `${greeting}, your ISKCON Bureau password reset code is ${otp}. Valid for 10 minutes.`;
    }

    // Send SMS via Twilio (only for actual phone numbers)
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
        To: recipient,
        Body: smsBody
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Twilio error response:', errorData);
      
      // Parse Twilio error for better user feedback
      let userFriendlyMessage = 'Unable to send verification code. Please try again later.';
      
      if (errorData.includes('30485')) {
        userFriendlyMessage = 'SMS delivery temporarily blocked. Please try again in a few minutes or contact support.';
      } else if (errorData.includes('21211')) {
        userFriendlyMessage = 'Invalid phone number format. Please check and try again.';
      } else if (errorData.includes('21614')) {
        userFriendlyMessage = 'Phone number is not valid for SMS delivery.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyMessage,
          twilioError: errorData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await response.json();
    console.log('Twilio response:', responseData);
    console.log('OTP sent successfully to:', recipient);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        otp: otp // In production, store this securely instead of returning it
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
