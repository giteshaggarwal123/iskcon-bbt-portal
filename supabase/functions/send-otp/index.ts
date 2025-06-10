
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
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phoneNumber, name, type = 'otp', userId } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP or temporary password
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Handle password reset emails through Outlook
    if (type === 'password_reset') {
      // Get the admin/sender's Microsoft token to send email
      let senderToken = null;
      
      // First try to get token from the user making the request (if userId provided)
      if (userId) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('microsoft_access_token, microsoft_refresh_token, token_expires_at')
          .eq('id', userId)
          .single();
        
        if (userProfile?.microsoft_access_token) {
          // Check if token is still valid
          const expiresAt = new Date(userProfile.token_expires_at);
          const now = new Date();
          
          if (expiresAt > now) {
            senderToken = userProfile.microsoft_access_token;
          }
        }
      }
      
      // If no valid token from user, try to get from any super admin
      if (!senderToken) {
        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('id, microsoft_access_token, token_expires_at')
          .not('microsoft_access_token', 'is', null);
        
        if (adminProfiles && adminProfiles.length > 0) {
          for (const profile of adminProfiles) {
            const expiresAt = new Date(profile.token_expires_at);
            const now = new Date();
            
            if (expiresAt > now) {
              senderToken = profile.microsoft_access_token;
              break;
            }
          }
        }
      }
      
      if (!senderToken) {
        return new Response(
          JSON.stringify({ 
            error: 'No Microsoft account connected for sending emails',
            suggestion: 'Please connect a Microsoft account in Settings to enable email sending'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create personalized greeting
      const greeting = name ? `Hi ${name}` : 'Hello';
      
      const emailSubject = 'ISKCON Bureau - Password Reset';
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">ISKCON Bureau - Password Reset</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">${greeting},</p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              A password reset has been requested for your ISKCON Bureau account (${phoneNumber}).
            </p>
            <div style="background-color: #fff; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #333;">Your temporary password:</p>
              <p style="font-size: 24px; font-family: monospace; color: #007bff; margin: 10px 0; letter-spacing: 2px;">${otp}</p>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              <strong>Important:</strong> This temporary password is valid for 24 hours. Please log in and change your password immediately for security.
            </p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you didn't request this password reset, please contact the bureau administrators immediately.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This email was sent from ISKCON Bureau Management System
            </p>
          </div>
        </div>
      `;

      // Send email via Microsoft Graph
      const emailData = {
        message: {
          subject: emailSubject,
          body: {
            contentType: 'HTML',
            content: emailBody
          },
          toRecipients: [{
            emailAddress: {
              address: phoneNumber // phoneNumber is actually email for password reset
            }
          }]
        }
      };

      const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${senderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Microsoft Graph email error:', errorData);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send password reset email',
            details: errorData.error?.message || 'Unknown error'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password reset email sent successfully via Outlook to:', phoneNumber);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Password reset email sent successfully via Outlook',
          temporaryPassword: otp,
          email: phoneNumber
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Original SMS logic for OTP (phone login)
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create personalized greeting for SMS
    const greeting = name ? `Hi ${name}` : 'Hello';
    const smsBody = `${greeting}, your ISKCON Bureau login code is ${otp}. Valid for 10 minutes.`;

    // Send SMS via Twilio
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
        Body: smsBody
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Twilio error response:', errorData);
      
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
    console.log('OTP sent successfully to:', phoneNumber);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        otp: otp
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
