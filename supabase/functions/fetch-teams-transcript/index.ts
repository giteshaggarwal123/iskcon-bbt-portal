
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
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings?$orderby=creationDateTime desc&$top=50`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      },
      // Search through calendar events
      {
        name: 'Calendar Events Search',
        url: `https://graph.microsoft.com/v1.0/me/calendar/events?$orderby=createdDateTime desc&$top=50`,
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
          success: false,
          error: 'Meeting not found',
          details: 'Could not locate the meeting using the provided ID.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the actual Teams meeting ID for transcript lookup
    let actualMeetingId = meetingData.id
    console.log('Using meeting ID for transcript lookup:', actualMeetingId)

    // Try comprehensive transcript retrieval methods - including fallbacks for instant meetings
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
      },
      // Method 4: Direct call recording API (fallback for instant meetings)
      {
        name: 'Call Records API',
        url: `https://graph.microsoft.com/v1.0/communications/callRecords?$filter=contains(subject,'${encodeURIComponent(meetingData.subject || '')}')`
      }
    ]

    let transcriptData = null
    let transcriptError = null
    let successfulTranscriptMethod = null
    let callRecordData = null

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
          const data = await transcriptResponse.json()
          
          if (method.name === 'Call Records API') {
            callRecordData = data
            console.log(`Call records found:`, data.value?.length || 0)
            // Try to extract transcript from call records
            if (data.value?.length > 0) {
              // Find the most recent call record that might have transcripts
              for (const callRecord of data.value) {
                try {
                  const sessionsResponse = await fetch(
                    `https://graph.microsoft.com/v1.0/communications/callRecords/${callRecord.id}/sessions`,
                    {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  )
                  
                  if (sessionsResponse.ok) {
                    const sessionsData = await sessionsResponse.json()
                    console.log(`Sessions found for call record ${callRecord.id}:`, sessionsData.value?.length || 0)
                    
                    // Check if any session has transcript data
                    for (const session of sessionsData.value || []) {
                      if (session.segments && session.segments.some((seg: any) => seg.transcript)) {
                        transcriptData = {
                          value: [{
                            id: `callrecord_${callRecord.id}`,
                            transcriptContent: session.segments
                              .filter((seg: any) => seg.transcript)
                              .map((seg: any) => seg.transcript)
                              .join('\n')
                          }]
                        }
                        successfulTranscriptMethod = method.name
                        console.log('Found transcript data in call record sessions')
                        break
                      }
                    }
                  }
                } catch (sessionError) {
                  console.warn(`Error fetching sessions for call record ${callRecord.id}:`, sessionError)
                }
                
                if (transcriptData) break
              }
            }
          } else {
            transcriptData = data
            successfulTranscriptMethod = method.name
            console.log(`Transcript data retrieved using ${method.name}:`, {
              transcriptCount: transcriptData.value?.length || 0
            })
          }
          
          if (transcriptData?.value?.length > 0) break
        } else {
          const errorText = await transcriptResponse.text()
          transcriptError = errorText
          console.warn(`${method.name} failed:`, transcriptResponse.status, transcriptResponse.statusText, errorText)
        }
      } catch (error) {
        console.warn(`Error with ${method.name}:`, error)
        transcriptError = error.message
      }
    }

    // If still no transcript, try alternative recording-based extraction
    if (!transcriptData || !transcriptData.value?.length) {
      console.log('Standard transcript methods failed, trying recording-based extraction...')
      
      try {
        // Try to get recordings which might have embedded transcript data
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
          
          // Try to extract any available metadata that might contain transcript info
          if (recordingsData.value?.length > 0) {
            for (const recording of recordingsData.value) {
              // Check if recording has any transcript metadata
              if (recording.recordingContentUrl) {
                try {
                  // Try to fetch recording metadata that might contain transcript
                  const metadataResponse = await fetch(recording.recordingContentUrl, {
                    method: 'HEAD',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`
                    }
                  })
                  
                  if (metadataResponse.ok) {
                    // If we can access the recording, suggest manual extraction
                    return new Response(
                      JSON.stringify({
                        success: false,
                        hasRecordings: true,
                        recordings: recordingsData.value,
                        meeting: meetingData,
                        foundWith: successfulApproach,
                        error: 'Automatic transcript extraction not available for instant meetings',
                        details: 'This meeting has recordings available but requires manual transcript extraction. Try downloading the recording and extracting the transcript manually.',
                        suggestion: 'For future meetings, schedule through Outlook calendar to enable automatic transcript support.'
                      }),
                      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                  }
                } catch (recordingAccessError) {
                  console.warn(`Could not access recording ${recording.id}:`, recordingAccessError)
                }
              }
            }
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
        new Date(b.createdDateTime || Date.now()).getTime() - new Date(a.createdDateTime || Date.now()).getTime()
      )
      const firstTranscript = sortedTranscripts[0]
      transcriptId = firstTranscript.id
      
      // If transcript content is already available (from call records)
      if (firstTranscript.transcriptContent) {
        transcriptContent = firstTranscript.transcriptContent
        console.log('Using transcript content from call records, length:', transcriptContent.length)
      } else {
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
    }

    // Prepare final response
    const hasContent = !!transcriptContent && transcriptContent.trim().length > 0
    
    if (!transcriptData?.value?.length && !hasContent) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No transcript available for this meeting',
          details: 'Unable to extract transcript using any available method. The meeting may not have been recorded with transcription enabled.',
          meeting: meetingData,
          foundWith: successfulApproach,
          suggestion: 'Ensure future meetings are recorded with transcription enabled, or consider scheduling through Outlook calendar for better transcript support.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = {
      success: true,
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
      success: true,
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
        success: false,
        error: 'Internal server error occurred while fetching Teams data',
        details: error.message
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
