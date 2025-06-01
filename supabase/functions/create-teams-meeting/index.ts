
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

    const { title, description, startTime, endTime, attendees = [] } = await req.json()

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

    let accessToken = profile.microsoft_access_token

    // Create Teams meeting
    const meetingData = {
      startDateTime: startTime,
      endDateTime: endTime,
      subject: title
    }

    const teamsResponse = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    })

    if (!teamsResponse.ok) {
      const errorData = await teamsResponse.json()
      console.error('Teams meeting error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to create Teams meeting', details: errorData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const teamsData = await teamsResponse.json()

    // Create Outlook calendar event
    const calendarEventData = {
      subject: title,
      body: {
        contentType: 'HTML',
        content: `${description}<br/><br/>Join Teams Meeting: <a href="${teamsData.joinWebUrl}">${teamsData.joinWebUrl}</a>`
      },
      start: {
        dateTime: startTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC'
      },
      attendees: attendees.map((email: string) => ({
        emailAddress: {
          address: email,
          name: email
        },
        type: 'required'
      })),
      onlineMeeting: {
        joinUrl: teamsData.joinWebUrl
      }
    }

    const calendarResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calendarEventData)
    })

    let outlookEventId = null
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json()
      outlookEventId = calendarData.id
    }

    // Store meeting in database
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        meeting_type: 'online',
        teams_meeting_id: teamsData.id,
        teams_join_url: teamsData.joinWebUrl,
        outlook_event_id: outlookEventId,
        created_by: user.id
      })
      .select()
      .single()

    if (meetingError) {
      console.error('Failed to store meeting:', meetingError)
      return new Response(
        JSON.stringify({ error: 'Failed to store meeting', details: meetingError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        meeting: meeting,
        teamsJoinUrl: teamsData.joinWebUrl,
        outlookEventId: outlookEventId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create meeting error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
