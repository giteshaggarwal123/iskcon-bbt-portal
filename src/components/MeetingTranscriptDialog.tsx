
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Save, RefreshCw, Users, Clock, CheckCircle } from 'lucide-react';
import { useTranscripts } from '@/hooks/useTranscripts';
import { useAttendance } from '@/hooks/useAttendance';

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

  const { 
    fetchTranscriptForMeeting, 
    fetchTeamsTranscript, 
    saveTranscript, 
    saveTranscriptToDocuments 
  } = useTranscripts();
  const { autoTrackOnlineAttendance } = useAttendance();

  const loadTranscript = async () => {
    if (!meeting) return;

    setLoading(true);
    try {
      // First check if we have a saved transcript
      const savedTranscript = await fetchTranscriptForMeeting(meeting.id);
      
      if (savedTranscript) {
        setTranscript(savedTranscript);
      } else if (meeting.teams_meeting_id) {
        // Check if meeting has ended
        const now = new Date();
        const endTime = new Date(meeting.end_time);
        
        if (endTime <= now) {
          // Meeting has ended, try to fetch from Teams
          setAutoProcessing(true);
          const teamsData = await fetchTeamsTranscript(meeting.id, meeting.teams_meeting_id);
          
          if (teamsData && teamsData.hasContent) {
            // Auto-track attendance from Teams data
            if (teamsData.attendees) {
              await autoTrackOnlineAttendance(meeting.id, teamsData);
            }

            // Process and save the transcript
            const processedTranscript = {
              content: teamsData.transcriptContent || '',
              summary: 'AI-generated summary will be available soon',
              actionItems: [],
              participants: teamsData.attendees?.value?.[0]?.attendanceRecords || [],
              teamsTranscriptId: teamsData.transcript?.value?.[0]?.id
            };

            const saved = await saveTranscript(meeting.id, processedTranscript);
            if (saved) {
              setTranscript(saved);
            }
          }
          setAutoProcessing(false);
        }
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
      setAutoProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDocuments = async () => {
    if (!transcript || !meeting) return;

    setSaving(true);
    try {
      await saveTranscriptToDocuments(transcript, meeting.title);
    } catch (error) {
      console.error('Error saving to documents:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!transcript) return;

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
    a.download = `${meeting.title}_transcript_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (open && meeting) {
      loadTranscript();
    }
  }, [open, meeting]);

  if (!meeting) return null;

  const meetingEnded = new Date(meeting.end_time) <= new Date();

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
              {meetingEnded && meeting.teams_meeting_id && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Auto-processed</span>
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadTranscript}
                disabled={loading || autoProcessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || autoProcessing) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                    {saving ? 'Saving...' : 'Save to Documents'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {(loading || autoProcessing) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">
                {autoProcessing ? 'Auto-processing transcript from Teams...' : 'Loading transcript...'}
              </p>
            </div>
          )}

          {!loading && !autoProcessing && !transcript && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No transcript available for this meeting</p>
              {meeting.teams_meeting_id && !meetingEnded && (
                <p className="text-sm mt-2">
                  Transcript will be automatically processed after the meeting ends
                </p>
              )}
              {meeting.teams_meeting_id && meetingEnded && (
                <p className="text-sm mt-2">
                  Transcript may take a few minutes to become available after the meeting
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
