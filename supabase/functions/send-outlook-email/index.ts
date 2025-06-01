
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { subject, body, recipients, attachments = [] } = await req.json()

    // Get user's Microsoft tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('microsoft_access_token, microsoft_refresh_token, token_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.microsoft_access_token) {
      return new Response(
        JSON.stringify({ error: 'Microsoft account not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token needs refresh
    let accessToken = profile.microsoft_access_token
    if (new Date(profile.token_expires_at) <= new Date()) {
      // Refresh token logic here
      console.log('Token expired, would refresh here')
    }

    // Prepare email data
    const emailData = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: recipients.map((email: string) => ({
          emailAddress: {
            address: email
          }
        })),
        attachments: attachments
      }
    }

    // Send email via Microsoft Graph
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Microsoft Graph error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log email in database
    const { error: logError } = await supabase
      .from('emails')
      .insert({
        subject,
        body,
        recipients,
        sender_id: user.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Failed to log email:', logError)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
