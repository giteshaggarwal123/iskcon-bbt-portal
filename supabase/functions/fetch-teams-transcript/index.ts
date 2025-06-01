
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { meetingId, accessToken } = await req.json()

    if (!meetingId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing meetingId or accessToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch meeting transcript from Microsoft Graph
    const transcriptResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/transcripts`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch transcript: ${transcriptResponse.statusText}`)
    }

    const transcriptData = await transcriptResponse.json()
    
    // Get meeting attendees
    const attendeesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/attendanceReports`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    let attendeesData = null
    if (attendeesResponse.ok) {
      attendeesData = await attendeesResponse.json()
    }

    return new Response(
      JSON.stringify({
        transcript: transcriptData,
        attendees: attendeesData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error fetching Teams data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
