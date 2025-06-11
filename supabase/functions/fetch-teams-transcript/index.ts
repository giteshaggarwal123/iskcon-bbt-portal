
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

    // Try different approaches to find the meeting
    const approaches = [
      // Approach 1: Direct online meeting lookup
      {
        name: 'Direct Online Meeting',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`
      },
      // Approach 2: Search through all online meetings
      {
        name: 'Search Online Meetings',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings?$filter=joinWebUrl eq '${meetingId}' or id eq '${meetingId}'`
      },
      // Approach 3: Try calendar events
      {
        name: 'Calendar Events',
        url: `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=onlineMeeting/joinUrl eq '${meetingId}' or id eq '${meetingId}'`
      }
    ]

    let meetingData = null
    let successfulApproach = null

    for (const approach of approaches) {
      try {
        console.log(`Trying approach: ${approach.name}`)
        const meetingResponse = await fetch(approach.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (meetingResponse.ok) {
          const data = await meetingResponse.json()
          
          if (approach.name === 'Search Online Meetings' || approach.name === 'Calendar Events') {
            // Handle array response
            if (data.value && data.value.length > 0) {
              meetingData = data.value[0]
              successfulApproach = approach.name
              console.log(`Found meeting using ${approach.name}:`, {
                id: meetingData.id,
                subject: meetingData.subject || meetingData.summary,
                startDateTime: meetingData.startDateTime || meetingData.start?.dateTime
              })
              break
            }
          } else {
            // Handle direct object response
            meetingData = data
            successfulApproach = approach.name
            console.log(`Found meeting using ${approach.name}:`, {
              id: meetingData.id,
              subject: meetingData.subject,
              startDateTime: meetingData.startDateTime
            })
            break
          }
        } else {
          console.warn(`${approach.name} failed:`, meetingResponse.status, meetingResponse.statusText)
        }
      } catch (error) {
        console.warn(`Error with ${approach.name}:`, error)
      }
    }

    if (!meetingData) {
      console.error('Meeting not found with any approach')
      return new Response(
        JSON.stringify({ 
          error: 'Meeting not found',
          details: 'The meeting could not be found using the provided ID. This could mean the meeting has been deleted, the ID is incorrect, or you don\'t have access to it.',
          troubleshooting: [
            'Verify the meeting still exists in Teams',
            'Check that you have access to the meeting',
            'Ensure the meeting was created through Teams integration',
            'Try refreshing your Microsoft connection in Settings'
          ]
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the actual Teams meeting ID for transcript lookup
    let actualMeetingId = meetingData.id
    
    // If this is a calendar event, try to get the online meeting ID
    if (meetingData.onlineMeeting?.joinUrl) {
      // Try to extract meeting ID from the join URL or use the online meeting ID
      if (meetingData.onlineMeeting.conferenceId) {
        actualMeetingId = meetingData.onlineMeeting.conferenceId
      }
    }

    console.log('Using meeting ID for transcript lookup:', actualMeetingId)

    // Fetch meeting transcript from Microsoft Graph
    const transcriptResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts`,
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
      
      // Provide more helpful error messages
      let userFriendlyError = 'Failed to fetch meeting transcript'
      if (transcriptResponse.status === 404) {
        userFriendlyError = 'No transcript found for this meeting. Transcripts are only available if recording and transcription were enabled during the meeting.'
      } else if (transcriptResponse.status === 403) {
        userFriendlyError = 'Access denied to meeting transcript. You may not have permission to access this meeting\'s transcript.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyError,
          details: errorText,
          meeting: meetingData,
          foundWith: successfulApproach,
          troubleshooting: [
            'Ensure the meeting was recorded in Teams',
            'Check that transcription was enabled during the meeting',
            'Wait up to 24 hours after the meeting ends for transcript processing',
            'Verify you have access to the meeting transcript'
          ]
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
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/attendanceReports`,
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
      
      // Try different content formats with enhanced error handling
      const contentFormats = [
        { format: 'text/vtt', accept: 'text/plain' },
        { format: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', accept: 'application/octet-stream' },
        { format: 'text/plain', accept: 'text/plain' }
      ]
      
      for (const { format, accept } of contentFormats) {
        try {
          console.log(`Trying content format: ${format}`)
          const contentResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts/${transcriptId}/content?$format=${format}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': accept
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
            const errorText = await contentResponse.text()
            console.warn(`Failed to fetch transcript content with format ${format}:`, contentResponse.status, contentResponse.statusText, errorText)
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
      transcriptId: transcriptId,
      foundWith: successfulApproach,
      actualMeetingId: actualMeetingId
    }

    console.log('Final response summary:', {
      hasTranscript: !!transcriptData.value?.length,
      hasContent: response.hasContent,
      contentLength: transcriptContent?.length || 0,
      hasAttendees: !!attendeesData?.value?.length,
      foundWith: successfulApproach,
      actualMeetingId: actualMeetingId
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
      JSON.stringify({ 
        error: 'Internal server error occurred while fetching Teams data',
        details: error.message,
        troubleshooting: [
          'Check your Microsoft account connection in Settings',
          'Ensure you have proper permissions to access the meeting',
          'Try refreshing your Microsoft token',
          'Verify the meeting still exists in Teams'
        ]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
