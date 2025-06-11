
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

    // First, try to get the online meeting details to validate the meeting exists
    const meetingResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!meetingResponse.ok) {
      console.error('Failed to fetch meeting details:', meetingResponse.status, meetingResponse.statusText)
      const errorText = await meetingResponse.text()
      console.error('Meeting error details:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch meeting details: ${meetingResponse.statusText}`,
          details: errorText
        }),
        { status: meetingResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const meetingData = await meetingResponse.json()
    console.log('Meeting data received:', {
      id: meetingData.id,
      subject: meetingData.subject,
      startDateTime: meetingData.startDateTime,
      endDateTime: meetingData.endDateTime
    })

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
      console.error('Transcript error details:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch transcript: ${transcriptResponse.statusText}`,
          details: errorText,
          meeting: meetingData
        }),
        { status: transcriptResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transcriptData = await transcriptResponse.json()
    console.log('Transcript data received:', {
      transcriptCount: transcriptData.value?.length || 0,
      transcripts: transcriptData.value?.map(t => ({
        id: t.id,
        createdDateTime: t.createdDateTime,
        meetingId: t.meetingId
      })) || []
    })
    
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
        console.log('Attendees data received:', {
          reportCount: attendeesData.value?.length || 0,
          totalRecords: attendeesData.value?.[0]?.attendanceRecords?.length || 0
        })
      } else {
        console.warn('Failed to fetch attendees:', attendeesResponse.status, attendeesResponse.statusText)
      }
    } catch (error) {
      console.warn('Error fetching attendees:', error)
    }

    // If we have transcripts, fetch the actual transcript content
    let transcriptContent = null
    let transcriptId = null
    
    if (transcriptData.value && transcriptData.value.length > 0) {
      // Use the most recent transcript
      const sortedTranscripts = transcriptData.value.sort((a: any, b: any) => 
        new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime()
      )
      const firstTranscript = sortedTranscripts[0]
      transcriptId = firstTranscript.id
      
      console.log('Fetching transcript content for:', transcriptId)
      
      // Try different content formats
      const contentFormats = [
        'text/vtt',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      for (const format of contentFormats) {
        try {
          console.log(`Trying format: ${format}`)
          const contentResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content?$format=${format}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': format === 'text/vtt' ? 'text/plain' : format
              }
            }
          )

          if (contentResponse.ok) {
            const content = await contentResponse.text()
            if (content && content.trim().length > 0) {
              transcriptContent = content
              console.log(`Transcript content fetched successfully with format ${format}, length:`, content.length)
              break
            } else {
              console.log(`Empty content received for format ${format}`)
            }
          } else {
            console.warn(`Failed to fetch transcript content with format ${format}:`, contentResponse.status, contentResponse.statusText)
          }
        } catch (error) {
          console.warn(`Error fetching transcript content with format ${format}:`, error)
        }
      }
      
      if (!transcriptContent) {
        console.warn('No transcript content could be retrieved from any format')
      }
    } else {
      console.log('No transcripts found for this meeting')
    }

    const response = {
      transcript: transcriptData,
      transcriptContent: transcriptContent,
      attendees: attendeesData,
      hasContent: !!transcriptContent && transcriptContent.trim().length > 0,
      meeting: meetingData,
      transcriptId: transcriptId
    }

    console.log('Final response summary:', {
      hasTranscript: !!transcriptData.value?.length,
      hasContent: response.hasContent,
      contentLength: transcriptContent?.length || 0,
      hasAttendees: !!attendeesData?.value?.length
    })

    return new Response(
      JSON.stringify(response),
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
