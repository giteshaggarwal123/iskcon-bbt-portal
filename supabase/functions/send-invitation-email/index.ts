
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, role }: InvitationRequest = await req.json();

    console.log('Sending invitation to:', email);

    // For now, just log the invitation - in production you'd integrate with your email service
    console.log(`
      Invitation Details:
      - Email: ${email}
      - Name: ${firstName} ${lastName}
      - Role: ${role}
      
      Subject: Invitation to Join Bureau Management System
      
      Dear ${firstName} ${lastName},
      
      You have been invited to join the Bureau Management System as a ${role}.
      
      Please contact your administrator to complete your account setup.
      
      Best regards,
      Bureau Management Team
    `);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email logged successfully' 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
