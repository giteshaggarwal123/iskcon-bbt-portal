
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

    console.log('Fetching transcript for meeting:', meetingId)

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
      console.error('Failed to fetch transcript:', transcriptResponse.status, transcriptResponse.statusText)
      const errorText = await transcriptResponse.text()
      console.error('Error details:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch transcript: ${transcriptResponse.statusText}`,
          details: errorText
        }),
        { status: transcriptResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transcriptData = await transcriptResponse.json()
    console.log('Transcript data received:', transcriptData)
    
    // Get meeting attendees
    let attendeesData = null
    try {
      const attendeesResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/attendanceReports`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (attendeesResponse.ok) {
        attendeesData = await attendeesResponse.json()
        console.log('Attendees data received:', attendeesData)
      } else {
        console.warn('Failed to fetch attendees:', attendeesResponse.status, attendeesResponse.statusText)
      }
    } catch (error) {
      console.warn('Error fetching attendees:', error)
    }

    // If we have transcripts, fetch the actual transcript content
    let transcriptContent = null
    if (transcriptData.value && transcriptData.value.length > 0) {
      const firstTranscript = transcriptData.value[0]
      console.log('Fetching transcript content for:', firstTranscript.id)
      
      try {
        const contentResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/transcripts/${firstTranscript.id}/content?$format=text/vtt`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'text/plain'
            }
          }
        )

        if (contentResponse.ok) {
          transcriptContent = await contentResponse.text()
          console.log('Transcript content fetched successfully')
        } else {
          console.warn('Failed to fetch transcript content:', contentResponse.status, contentResponse.statusText)
        }
      } catch (error) {
        console.warn('Error fetching transcript content:', error)
      }
    }

    return new Response(
      JSON.stringify({
        transcript: transcriptData,
        transcriptContent: transcriptContent,
        attendees: attendeesData,
        hasContent: !!transcriptContent
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
