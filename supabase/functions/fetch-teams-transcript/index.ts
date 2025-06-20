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

    // Enhanced transcript retrieval with improved content fetching
    const transcriptMethods = [
      // Method 1: Standard transcript API with multiple content formats
      {
        name: 'Standard Transcript API',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts`,
        contentFormats: ['text/vtt', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      },
      // Method 2: Beta API endpoint with content formats
      {
        name: 'Beta Transcript API',
        url: `https://graph.microsoft.com/beta/me/onlineMeetings/${actualMeetingId}/transcripts`,
        contentFormats: ['text/vtt', 'text/plain']
      },
      // Method 3: Try with different meeting ID formats
      {
        name: 'Encoded Meeting ID Transcript',
        url: `https://graph.microsoft.com/v1.0/me/onlineMeetings/${encodeURIComponent(actualMeetingId)}/transcripts`,
        contentFormats: ['text/vtt', 'text/plain']
      }
    ]

    let transcriptData = null
    let transcriptContent = null
    let successfulTranscriptMethod = null

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
          console.log(`${method.name} response:`, {
            transcriptCount: data.value?.length || 0,
            hasTranscripts: !!data.value?.length
          })
          
          if (data.value?.length > 0) {
            transcriptData = data
            successfulTranscriptMethod = method.name
            
            // Try to get content for each transcript with multiple formats
            const sortedTranscripts = data.value.sort((a: any, b: any) => 
              new Date(b.createdDateTime || Date.now()).getTime() - new Date(a.createdDateTime || Date.now()).getTime()
            )
            
            for (const transcript of sortedTranscripts) {
              const transcriptId = transcript.id
              console.log(`Attempting to fetch content for transcript: ${transcriptId}`)
              
              // Try multiple content formats for this transcript
              for (const format of method.contentFormats) {
                try {
                  console.log(`Trying content format: ${format}`)
                  
                  // Build content URL with proper meeting ID format
                  let contentUrl = method.url.replace('/transcripts', `/transcripts/${transcriptId}/content`)
                  
                  const contentResponse = await fetch(
                    `${contentUrl}?$format=${format}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': format === 'text/vtt' ? 'text/plain' : 
                                format === 'text/plain' ? 'text/plain' : 'application/octet-stream'
                      }
                    }
                  )

                  if (contentResponse.ok) {
                    const content = await contentResponse.text()
                    console.log(`Content fetched successfully:`, {
                      format: format,
                      contentLength: content.length,
                      contentPreview: content.substring(0, 200)
                    })
                    
                    if (content && content.trim().length > 0) {
                      // Clean up VTT format if needed
                      if (format === 'text/vtt') {
                        // Remove VTT headers and timestamps, keep only text
                        const lines = content.split('\n')
                        const textLines = lines.filter(line => 
                          !line.startsWith('WEBVTT') && 
                          !line.match(/^\d{2}:\d{2}:\d{2}/) &&
                          !line.includes('-->') &&
                          line.trim().length > 0
                        )
                        transcriptContent = textLines.join('\n').trim()
                      } else {
                        transcriptContent = content
                      }
                      
                      console.log(`Processed transcript content length: ${transcriptContent.length}`)
                      break // Found content, break out of format loop
                    }
                  } else {
                    const errorText = await contentResponse.text()
                    console.warn(`Content fetch failed for ${format}:`, contentResponse.status, errorText)
                  }
                } catch (error) {
                  console.warn(`Error fetching content with ${format}:`, error)
                }
              }
              
              if (transcriptContent) {
                break // Found content, break out of transcript loop
              }
            }
            
            if (transcriptContent) {
              break // Found content, break out of method loop
            }
          }
        } else {
          const errorText = await transcriptResponse.text()
          console.warn(`${method.name} failed:`, transcriptResponse.status, transcriptResponse.statusText, errorText)
        }
      } catch (error) {
        console.warn(`Error with ${method.name}:`, error)
      }
    }

    // If no content found through standard methods, try alternative approaches
    if (!transcriptContent && transcriptData?.value?.length > 0) {
      console.log('Trying alternative content extraction methods...')
      
      // Try direct content URLs with different approaches
      const alternativeContentMethods = [
        // Method 1: Try without format specification
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${actualMeetingId}/transcripts/${transcriptData.value[0].id}/content`,
        // Method 2: Try beta endpoint
        `https://graph.microsoft.com/beta/me/onlineMeetings/${actualMeetingId}/transcripts/${transcriptData.value[0].id}/content`,
        // Method 3: Try with encoded meeting ID
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${encodeURIComponent(actualMeetingId)}/transcripts/${transcriptData.value[0].id}/content`
      ]
      
      for (const contentUrl of alternativeContentMethods) {
        try {
          console.log(`Trying alternative content URL: ${contentUrl}`)
          
          const contentResponse = await fetch(contentUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'text/plain'
            }
          })

          if (contentResponse.ok) {
            const content = await contentResponse.text()
            if (content && content.trim().length > 0) {
              transcriptContent = content
              console.log(`Alternative method successful, content length: ${content.length}`)
              break
            }
          }
        } catch (error) {
          console.warn(`Alternative content method failed:`, error)
        }
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

    // Prepare final response
    const hasContent = !!transcriptContent && transcriptContent.trim().length > 0
    const hasTranscripts = !!transcriptData?.value?.length
    
    if (!hasTranscripts && !hasContent) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No transcript found for this meeting',
          details: 'No transcript data was found using any available method. The meeting may not have been recorded with transcription enabled.',
          meeting: meetingData,
          foundWith: successfulApproach,
          suggestion: 'Ensure the meeting was recorded with transcription enabled in Teams settings.'
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
      transcriptId: transcriptData?.value?.[0]?.id,
      foundWith: successfulApproach,
      transcriptMethod: successfulTranscriptMethod,
      actualMeetingId: actualMeetingId,
      extractionDetails: {
        transcriptsFound: transcriptData?.value?.length || 0,
        contentExtracted: hasContent,
        contentLength: transcriptContent?.length || 0
      }
    }

    console.log('Final response summary:', {
      success: true,
      hasTranscripts: hasTranscripts,
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
