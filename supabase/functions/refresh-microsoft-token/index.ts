
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
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Refreshing Microsoft token for user:', user_id)

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user profile with tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('microsoft_refresh_token, token_expires_at')
      .eq('id', user_id)
      .single()

    if (profileError || !profile?.microsoft_refresh_token) {
      return new Response(
        JSON.stringify({ error: 'No refresh token found or profile error', details: profileError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID') || 'b2333ef6-3378-4d02-b9b9-d8e66d9dfa3d'

    // Refresh the access token using the refresh token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('MICROSOFT_CLIENT_ID') || '',
        client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET') || '',
        refresh_token: profile.microsoft_refresh_token,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All https://graph.microsoft.com/OnlineMeetings.ReadWrite'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Microsoft token refresh error:', tokenData)
      return new Response(
        JSON.stringify({ error: 'Failed to refresh token', details: tokenData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Token refresh successful')

    // Update the profile with new tokens
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        microsoft_access_token: tokenData.access_token,
        microsoft_refresh_token: tokenData.refresh_token || profile.microsoft_refresh_token, // Keep old refresh token if new one not provided
        token_expires_at: expiresAt
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to store refreshed tokens', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Microsoft tokens refreshed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_at: expiresAt,
        access_token: tokenData.access_token
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Microsoft token refresh error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
