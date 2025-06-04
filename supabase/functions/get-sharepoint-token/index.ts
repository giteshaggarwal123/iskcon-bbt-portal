
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's Microsoft tokens from profile
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

    // Check if token is expired
    const expiresAt = new Date(profile.token_expires_at)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt <= fiveMinutesFromNow) {
      // Token needs refresh
      console.log('Token expired, attempting refresh...')
      
      const tenantId = Deno.env.get('MICROSOFT_TENANT_ID') || 'b2333ef6-3378-4d02-b9b9-d8e66d9dfa3d'
      
      const refreshResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID') || '',
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET') || '',
          refresh_token: profile.microsoft_refresh_token,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Sites.ReadWrite.All https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/User.Read offline_access'
        })
      })

      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        console.error('Token refresh failed:', refreshData)
        return new Response(
          JSON.stringify({ error: 'Token refresh failed', details: refreshData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update tokens in database
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in - 300) * 1000).toISOString()
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          microsoft_access_token: refreshData.access_token,
          microsoft_refresh_token: refreshData.refresh_token || profile.microsoft_refresh_token,
          token_expires_at: newExpiresAt
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update tokens:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update tokens' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          access_token: refreshData.access_token,
          expires_at: newExpiresAt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return existing valid token
    return new Response(
      JSON.stringify({ 
        access_token: profile.microsoft_access_token,
        expires_at: profile.token_expires_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('SharePoint token error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
