
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's Microsoft access token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('microsoft_access_token')
      .eq('id', user_id)
      .single()

    if (profileError || !profile?.microsoft_access_token) {
      return new Response(
        JSON.stringify({ error: 'Microsoft account not connected' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Fetching meetings from Microsoft Graph API...')

    // Fetch meetings from Microsoft Graph API
    const graphResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge \'' + 
      new Date().toISOString() + '\'&$orderby=start/dateTime&$top=100',
      {
        headers: {
          'Authorization': `Bearer ${profile.microsoft_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text()
      console.error('Microsoft Graph API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch meetings from Outlook' }),
        { 
          status: graphResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const graphData = await graphResponse.json()
    console.log(`Found ${graphData.value?.length || 0} meetings from Outlook`)

    // Get existing meetings from our database
    const { data: existingMeetings } = await supabase
      .from('meetings')
      .select('outlook_event_id, id')
      .eq('created_by', user_id)

    const existingEventIds = new Set(
      existingMeetings?.map((m: any) => m.outlook_event_id).filter(Boolean) || []
    )

    let syncedCount = 0
    let skippedCount = 0

    // Process each meeting from Outlook
    for (const event of graphData.value || []) {
      // Skip if we already have this meeting
      if (existingEventIds.has(event.id)) {
        skippedCount++
        continue
      }

      // Skip all-day events or events without proper time data
      if (!event.start?.dateTime || !event.end?.dateTime) {
        skippedCount++
        continue
      }

      try {
        // Determine meeting type based on online meeting info
        const meetingType = event.onlineMeeting?.joinUrl ? 'online' : 'physical'
        
        // Create meeting in our database
        const { error: insertError } = await supabase
          .from('meetings')
          .insert({
            title: event.subject || 'Untitled Meeting',
            description: event.body?.content || event.bodyPreview || null,
            start_time: event.start.dateTime,
            end_time: event.end.dateTime,
            location: event.location?.displayName || null,
            meeting_type: meetingType,
            status: 'scheduled',
            created_by: user_id,
            outlook_event_id: event.id,
            teams_join_url: event.onlineMeeting?.joinUrl || null,
            teams_meeting_id: event.onlineMeeting?.conferenceId || null
          })

        if (insertError) {
          console.error('Error inserting meeting:', insertError)
        } else {
          syncedCount++
          console.log(`Synced meeting: ${event.subject}`)
        }
      } catch (error) {
        console.error('Error processing meeting:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedCount, 
        skippedCount,
        totalFound: graphData.value?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
