
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

    // Enhanced approach to find the meeting with more methods
    const findMeetingApproaches = [
      // Direct online meeting lookup
      {
        name: 'Direct Online Meeting',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      },
      // Try decoding if it's base64 encoded
      {
        name: 'Decoded Meeting ID',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${decodeURIComponent(meetingId)}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      },
      // Search through recent meetings
      {
        name: 'Recent Online Meetings Search',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings?$orderby=creationDateTime desc`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      },
      // Search through calendar events
      {
        name: 'Calendar Events Search',
        url: `https://graph.microsoft.com/v1.0/me/calendar/events?$orderby=createdDateTime desc`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    ]

    let meetingData = null
    let successfulApproach = null

    for (const approach of findMeetingApproaches) {
      try {
        console.log(`Trying approach: ${approach.name}`)
        const meetingResponse = await fetch(approach.url, approach)

        if (meetingResponse.ok) {
          const data = await meetingResponse.json()
          
          if (approach.name.includes('Search')) {
            // Handle array response - find matching meeting
            if (data.value && data.value.length > 0) {
              // Try to find exact match first
              let foundMeeting = data.value.find((meeting: any) => 
                meeting.id === meetingId || 
                meeting.id === decodeURIComponent(meetingId) ||
                meeting.onlineMeeting?.joinUrl?.includes(meetingId) ||
                meeting.joinWebUrl?.includes(meetingId)
              )
              
              // If no exact match, try partial matching
              if (!foundMeeting && meetingId.length > 10) {
                foundMeeting = data.value.find((meeting: any) => 
                  meeting.id?.includes(meetingId.substring(0, 20)) ||
                  meetingId.includes(meeting.id?.substring(0, 20))
                )
              }
              
              if (foundMeeting) {
                meetingData = foundMeeting
                successfulApproach = approach.name
                console.log(`Found meeting using ${approach.name}:`, {
                  id: meetingData.id,
                  subject: meetingData.subject || meetingData.summary,
                  startDateTime: meetingData.startDateTime || meetingData.start?.dateTime
                })
                break
              }
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
          const errorText = await meetingResponse.text()
          console.warn(`${approach.name} failed:`, meetingResponse.status, meetingResponse.statusText, errorText)
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
          details: 'Could not locate the meeting using the provided ID. The meeting may have been deleted, the ID may be incorrect, or access permissions may be insufficient.',
          troubleshooting: [
            'Verify the meeting still exists in Teams',
            'Check that you have access to the meeting',
            'Ensure your Microsoft connection is active in Settings',
            'Try refreshing your Microsoft token'
          ]
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the actual Teams meeting ID for transcript lookup
    let actualMeetingId = meetingData.id
    console.log('Using meeting ID for transcript lookup:', actualMeetingId)

    // Try multiple transcript retrieval methods
    const transcriptMethods = [
      // Method 1: Standard transcript API
      {
        name: 'Standard Transcript API',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts`
      },
      // Method 2: Beta API endpoint
      {
        name: 'Beta Transcript API',
        url: `https://graph.microsoft.com/beta/me/onlineMeetings/${actualMeetingId}/transcripts`
      },
      // Method 3: Communications endpoint
      {
        name: 'Communications API',
        url: `https://graph.microsoft.com/v1.0/communications/onlineMeetings/${actualMeetingId}/transcripts`
      }
    ]

    let transcriptData = null
    let transcriptError = null
    let successfulTranscriptMethod = null
    let isPreconditionFailed = false

    for (const method of transcriptMethods) {
      try {
        console.log(`Trying transcript method: ${method.name}`)
        
        const transcriptResponse = await fetch(method.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (transcriptResponse.ok) {
          transcriptData = await transcriptResponse.json()
          successfulTranscriptMethod = method.name
          console.log(`Transcript data retrieved using ${method.name}:`, {
            transcriptCount: transcriptData.value?.length || 0
          })
          break
        } else {
          const errorText = await transcriptResponse.text()
          transcriptError = errorText
          console.warn(`${method.name} failed:`, transcriptResponse.status, transcriptResponse.statusText, errorText)
          
          // Check for PreconditionFailed error
          if (transcriptResponse.status === 412 || errorText.includes('PreconditionFailed')) {
            isPreconditionFailed = true
          }
          
          // If it's a precondition failed error, continue to next method
          if (transcriptResponse.status === 412) {
            continue
          }
        }
      } catch (error) {
        console.warn(`Error with ${method.name}:`, error)
        transcriptError = error.message
      }
    }

    // If no transcript found through standard methods, try alternative approaches
    if (!transcriptData || !transcriptData.value?.length) {
      console.log('Standard transcript methods failed, trying alternative approaches...')
      
      // Alternative: Try to get recording files which might contain transcript data
      try {
        const recordingsResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/recordings`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (recordingsResponse.ok) {
          const recordingsData = await recordingsResponse.json()
          console.log('Recordings found:', recordingsData.value?.length || 0)
          
          // If recordings exist, suggest manual transcript extraction
          if (recordingsData.value?.length > 0) {
            return new Response(
              JSON.stringify({
                error: 'Transcript not directly available but recording exists',
                details: 'The meeting has recordings available, but automatic transcript extraction is not supported for this meeting type. This typically happens with meetings not created through calendar integration.',
                hasRecordings: true,
                recordings: recordingsData.value,
                meeting: meetingData,
                foundWith: successfulApproach,
                troubleshooting: [
                  'The meeting was likely created as an instant meeting rather than a scheduled calendar event',
                  'Transcript APIs only work with calendar-backed meetings',
                  'You may need to manually download the recording and extract transcript',
                  'Consider scheduling future meetings through Outlook calendar for automatic transcript support'
                ]
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } catch (recordingError) {
        console.warn('Error checking recordings:', recordingError)
      }
    }

    // Get meeting attendees if possible
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
          reportCount: attendeesData.value?.length || 0
        })
      }
    } catch (error) {
      console.warn('Error fetching attendees:', error)
    }

    // If we have transcript data, try to fetch the actual content
    let transcriptContent = null
    let transcriptId = null
    
    if (transcriptData?.value?.length > 0) {
      const sortedTranscripts = transcriptData.value.sort((a: any, b: any) => 
        new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime()
      )
      const firstTranscript = sortedTranscripts[0]
      transcriptId = firstTranscript.id
      
      console.log('Fetching transcript content for:', transcriptId)
      
      // Enhanced content retrieval with multiple formats and endpoints
      const contentApproaches = [
        {
          format: 'text/vtt',
          accept: 'text/plain',
          endpoint: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts/${transcriptId}/content`
        },
        {
          format: 'text/plain',
          accept: 'text/plain',
          endpoint: `https://graph.microsoft.com/beta/me/onlineMeetings/${actualMeetingId}/transcripts/${transcriptId}/content`
        },
        {
          format: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          accept: 'application/octet-stream',
          endpoint: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts/${transcriptId}/content`
        }
      ]
      
      for (const approach of contentApproaches) {
        try {
          console.log(`Trying content format: ${approach.format}`)
          const contentResponse = await fetch(
            `${approach.endpoint}?$format=${approach.format}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': approach.accept
              }
            }
          )

          if (contentResponse.ok) {
            const content = await contentResponse.text()
            if (content && content.trim().length > 0) {
              transcriptContent = content
              console.log(`Transcript content fetched successfully with format ${approach.format}, length:`, content.length)
              break
            }
          } else {
            const errorText = await contentResponse.text()
            console.warn(`Content fetch failed for ${approach.format}:`, contentResponse.status, errorText)
          }
        } catch (error) {
          console.warn(`Error fetching content with ${approach.format}:`, error)
        }
      }
    }

    // Prepare final response
    const hasContent = !!transcriptContent && transcriptContent.trim().length > 0
    
    if (!transcriptData?.value?.length && !hasContent) {
      // Provide detailed error information based on the specific error type
      let errorMessage = 'No transcript available for this meeting'
      let troubleshooting = [
        'Ensure the meeting was recorded in Teams',
        'Check that transcription was enabled during the meeting',
        'Wait up to 24 hours after the meeting for transcript processing',
        'Verify you have access to the meeting transcript'
      ]

      if (isPreconditionFailed) {
        errorMessage = 'Transcript not supported for this meeting type'
        troubleshooting = [
          'This meeting was likely created as an instant meeting rather than a scheduled calendar event',
          'Transcript APIs only work with calendar-backed meetings in Microsoft Teams',
          'For future meetings, schedule through Outlook calendar to enable automatic transcript support',
          'Consider manually downloading any available recordings'
        ]
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: transcriptError || 'The meeting was found but no transcript data is available.',
          meeting: meetingData,
          foundWith: successfulApproach,
          troubleshooting: troubleshooting
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = {
      transcript: transcriptData,
      transcriptContent: transcriptContent,
      attendees: attendeesData,
      hasContent: hasContent,
      meeting: meetingData,
      transcriptId: transcriptId,
      foundWith: successfulApproach,
      transcriptMethod: successfulTranscriptMethod,
      actualMeetingId: actualMeetingId
    }

    console.log('Final response summary:', {
      hasTranscript: !!transcriptData?.value?.length,
      hasContent: hasContent,
      contentLength: transcriptContent?.length || 0,
      foundWith: successfulApproach,
      transcriptMethod: successfulTranscriptMethod
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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
