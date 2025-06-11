import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Save, RefreshCw, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranscripts } from '@/hooks/useTranscripts';
import { useAttendance } from '@/hooks/useAttendance';
import { useToast } from '@/hooks/use-toast';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

interface MeetingTranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

export const MeetingTranscriptDialog: React.FC<MeetingTranscriptDialogProps> = ({ 
  open, 
  onOpenChange, 
  meeting 
}) => {
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { 
    fetchTranscriptForMeeting, 
    fetchTeamsTranscript, 
    saveTranscript, 
    saveTranscriptToDocuments 
  } = useTranscripts();
  const { autoTrackOnlineAttendance } = useAttendance();
  const { accessToken, isConnected, isExpired, forceRefresh } = useMicrosoftAuth();
  const { toast } = useToast();

  const loadTranscript = async (forceRefresh = false) => {
    if (!meeting) return;

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log(`Loading transcript for meeting: ${meeting.title} (ID: ${meeting.id})`);
      console.log('Teams meeting ID:', meeting.teams_meeting_id);
      console.log('Microsoft auth state:', { isConnected, isExpired, hasToken: !!accessToken });
      
      // First check if we have a saved transcript (skip if force refresh)
      if (!forceRefresh) {
        const savedTranscript = await fetchTranscriptForMeeting(meeting.id);
        if (savedTranscript && savedTranscript.transcript_content) {
          console.log('Found saved transcript with content:', savedTranscript);
          setTranscript(savedTranscript);
          setLoading(false);
          return;
        }
      }

      // If no saved transcript or force refresh, and we have a Teams meeting ID
      if (meeting.teams_meeting_id) {
        console.log(`Fetching Teams transcript for meeting ID: ${meeting.teams_meeting_id}`);
        
        // Check Microsoft auth status first
        if (!isConnected || isExpired) {
          setError('Microsoft account is not connected or token has expired. Please reconnect in Settings.');
          setLoading(false);
          return;
        }

        if (!accessToken) {
          setError('No Microsoft access token available. Please reconnect your Microsoft account in Settings.');
          setLoading(false);
          return;
        }

        setAutoProcessing(true);
        
        try {
          console.log('Calling fetch with access token...');
          const teamsData = await fetchTeamsTranscript(meeting.id, meeting.teams_meeting_id);
          console.log('Teams data received:', {
            hasData: !!teamsData,
            hasTranscript: teamsData?.transcript?.value?.length > 0,
            hasContent: !!teamsData?.transcriptContent,
            foundWith: teamsData?.foundWith,
            actualMeetingId: teamsData?.actualMeetingId,
            contentPreview: teamsData?.transcriptContent?.substring(0, 100)
          });

          // Store debug info for troubleshooting
          setDebugInfo({
            foundWith: teamsData?.foundWith,
            actualMeetingId: teamsData?.actualMeetingId,
            originalMeetingId: meeting.teams_meeting_id,
            hasTranscriptData: !!teamsData?.transcript?.value?.length,
            hasContent: !!teamsData?.transcriptContent
          });
          
          if (teamsData) {
            if (teamsData.hasContent && teamsData.transcriptContent) {
              console.log('Processing transcript content...');
              
              // Auto-track attendance from Teams data if available
              if (teamsData.attendees?.value?.[0]?.attendanceRecords) {
                try {
                  await autoTrackOnlineAttendance(meeting.id, teamsData);
                  console.log('Attendance tracked successfully');
                } catch (attendanceError) {
                  console.warn('Failed to track attendance:', attendanceError);
                }
              }

              // Process and save the transcript
              const processedTranscript = {
                content: teamsData.transcriptContent,
                summary: 'AI-generated summary will be available soon',
                actionItems: [],
                participants: teamsData.attendees?.value?.[0]?.attendanceRecords || [],
                teamsTranscriptId: teamsData.transcript?.value?.[0]?.id
              };

              console.log('Saving processed transcript...');
              const saved = await saveTranscript(meeting.id, processedTranscript);
              if (saved) {
                setTranscript(saved);
                toast({
                  title: "Transcript Loaded",
                  description: "Meeting transcript has been successfully loaded and saved."
                });
              }
            } else if (teamsData.transcript?.value?.length > 0) {
              // Transcript exists in Teams but content might not be ready yet
              const errorMsg = 'Transcript is available in Teams but content is still being processed. This can take up to 24 hours after the meeting ends.';
              setError(errorMsg);
              toast({
                title: "Transcript Processing",
                description: errorMsg,
                variant: "default"
              });
            } else {
              // No transcript found
              const errorMsg = `No transcript found for this meeting in Teams${teamsData.foundWith ? ` (searched using: ${teamsData.foundWith})` : ''}. Transcripts are only available if recording and transcription were enabled during the meeting.`;
              setError(errorMsg);
              toast({
                title: "No Transcript Available",
                description: errorMsg,
                variant: "destructive"
              });
            }
          } else {
            setError('Failed to fetch transcript from Teams. Please check if the meeting was recorded and transcription was enabled.');
          }
        } catch (teamsError: any) {
          console.error('Error fetching from Teams:', teamsError);
          let errorMessage = 'Failed to connect to Teams or fetch transcript.';
          
          if (teamsError.message?.includes('401') || teamsError.message?.includes('Unauthorized')) {
            errorMessage = 'Microsoft authentication expired. Please reconnect your Microsoft account in Settings.';
          } else if (teamsError.message?.includes('404')) {
            errorMessage = 'Meeting not found in Teams. The meeting may have been deleted or the ID may be incorrect.';
          } else if (teamsError.message?.includes('Meeting not found')) {
            errorMessage = teamsError.message;
          } else if (teamsError.message) {
            errorMessage = teamsError.message;
          }
          
          setError(errorMessage);
        }
        
        setAutoProcessing(false);
      } else {
        setError('This meeting was not created through Teams integration, so no transcript is available.');
      }
    } catch (error: any) {
      console.error('Error loading transcript:', error);
      setError('An unexpected error occurred while loading the transcript. Please try again.');
      setAutoProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDocuments = async () => {
    if (!transcript || !meeting) return;

    setSaving(true);
    try {
      const success = await saveTranscriptToDocuments(transcript, meeting.title, meeting.end_time);
      if (success) {
        toast({
          title: "Success",
          description: "Transcript has been saved to ISKCON Repository > Meeting Transcripts"
        });
      }
    } catch (error) {
      console.error('Error saving to documents:', error);
      toast({
        title: "Error",
        description: "Failed to save transcript to documents",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!transcript) return;

    const meetingDate = new Date(meeting.end_time || meeting.start_time).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');

    const content = `
Meeting: ${meeting.title}
Date: ${new Date(meeting.start_time).toLocaleDateString()}
Duration: ${Math.round((new Date(meeting.end_time).getTime() - new Date(meeting.start_time).getTime()) / (1000 * 60))} minutes

SUMMARY:
${transcript.summary || 'No summary available'}

PARTICIPANTS:
${transcript.participants?.map((p: any) => `- ${p.identity?.displayName || p.identity?.user?.displayName || p.emailAddress || 'Unknown'}`).join('\n') || 'No participants listed'}

TRANSCRIPT:
${transcript.transcript_content || 'No transcript content available'}

ACTION ITEMS:
${transcript.action_items?.map((item: any, index: number) => `${index + 1}. ${item.text || item}`).join('\n') || 'No action items'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title}_${meetingDate}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleForceRefresh = async () => {
    // First refresh the Microsoft token if needed
    if (isExpired) {
      console.log('Refreshing Microsoft token before transcript fetch...');
      await forceRefresh();
    }
    loadTranscript(true);
  };

  useEffect(() => {
    if (open && meeting) {
      loadTranscript();
    }
  }, [open, meeting]);

  if (!meeting) return null;

  const meetingEnded = new Date(meeting.end_time) <= new Date();
  const hasTeamsIntegration = !!meeting.teams_meeting_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Meeting Transcript & Notes</span>
          </DialogTitle>
          <DialogDescription>{meeting.title}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(meeting.start_time).toLocaleDateString()}</span>
              </div>
              {transcript?.participants && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{transcript.participants.length} participants</span>
                </div>
              )}
              {hasTeamsIntegration ? (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Teams Integration</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>No Teams Integration</span>
                </Badge>
              )}
              {!isConnected && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Microsoft Disconnected</span>
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadTranscript(false)}
                disabled={loading || autoProcessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || autoProcessing) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {hasTeamsIntegration && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleForceRefresh}
                  disabled={loading || autoProcessing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${(loading || autoProcessing) ? 'animate-spin' : ''}`} />
                  Force Refresh from Teams
                </Button>
              )}
              {transcript && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSaveToDocuments}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save to ISKCON Repository'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {(loading || autoProcessing) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">
                {autoProcessing ? 'Fetching transcript from Teams...' : 'Loading transcript...'}
              </p>
              {autoProcessing && (
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few moments as we retrieve the latest data from Microsoft Teams
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Transcript Not Available</h3>
                  <p className="text-yellow-700 text-sm mt-1">{error}</p>
                  
                  {debugInfo && (
                    <div className="mt-3 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                      <p><strong>Debug Info:</strong></p>
                      <p>Original Meeting ID: {debugInfo.originalMeetingId}</p>
                      {debugInfo.actualMeetingId !== debugInfo.originalMeetingId && (
                        <p>Actual Meeting ID: {debugInfo.actualMeetingId}</p>
                      )}
                      {debugInfo.foundWith && <p>Found via: {debugInfo.foundWith}</p>}
                      <p>Has Transcript Data: {debugInfo.hasTranscriptData ? 'Yes' : 'No'}</p>
                      <p>Has Content: {debugInfo.hasContent ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  
                  {hasTeamsIntegration && (
                    <div className="mt-3 text-sm text-yellow-700">
                      <p><strong>Troubleshooting tips:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Ensure the meeting was recorded in Teams</li>
                        <li>Check that transcription was enabled during the meeting</li>
                        <li>Wait up to 24 hours after the meeting ends for processing</li>
                        <li>Try the "Force Refresh from Teams" button</li>
                        <li>Verify your Microsoft account connection in Settings</li>
                        <li>Check if the meeting still exists in your Teams calendar</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !autoProcessing && !transcript && !error && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No transcript available for this meeting</p>
              {hasTeamsIntegration ? (
                <div className="text-sm mt-2 space-y-1">
                  <p>This meeting has Teams integration but no transcript was found.</p>
                  <p>Try the "Force Refresh from Teams" button if the meeting was recorded.</p>
                </div>
              ) : (
                <p className="text-sm mt-2">
                  This meeting was not created through Teams integration.
                </p>
              )}
            </div>
          )}

          {transcript && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-6">
                {transcript.summary && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700">{transcript.summary}</p>
                    </div>
                  </div>
                )}

                {transcript.participants && transcript.participants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Participants</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {transcript.participants.map((participant: any, index: number) => (
                        <Badge key={index} variant="outline">
                          {participant.identity?.displayName || 
                           participant.identity?.user?.displayName || 
                           participant.emailAddress || 
                           `Participant ${index + 1}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {transcript.action_items && transcript.action_items.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Action Items</h3>
                    <div className="space-y-2">
                      {transcript.action_items.map((item: any, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-sm text-gray-500 mt-1">{index + 1}.</span>
                          <span className="text-sm">{item.text || item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {transcript.transcript_content && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Full Transcript</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {transcript.transcript_content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
