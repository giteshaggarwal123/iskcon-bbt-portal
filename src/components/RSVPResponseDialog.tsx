import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useMeetings } from '@/hooks/useMeetings';

interface RSVPResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

interface AttendeeResponse {
  id: string;
  user_id: string;
  rsvp_response: 'yes' | 'no' | 'maybe' | null;
  rsvp_submitted_at: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  is_manual: boolean;
}

// Helper to normalize manual_attendees
function normalizeManualAttendees(manual_attendees: any): { email: string, rsvp: 'yes' | 'no' | 'maybe' | null }[] {
  if (!manual_attendees) return [];
  let arr: any[] = [];
  if (typeof manual_attendees === 'string') {
    try {
      arr = JSON.parse(manual_attendees);
    } catch { return []; }
  } else if (Array.isArray(manual_attendees)) {
    arr = manual_attendees;
  } else {
    return [];
  }
  // Only keep valid objects
  return arr
    .map((a) => {
      if (typeof a === 'string') {
        // Try to parse stringified object
        try {
          const obj = JSON.parse(a);
          if (obj && typeof obj.email === 'string') return { email: obj.email, rsvp: (obj.rsvp === 'yes' || obj.rsvp === 'no' || obj.rsvp === 'maybe') ? obj.rsvp : null };
        } catch { return null; }
        // If not parseable, treat as email only
        return { email: a, rsvp: null };
      }
      if (a && typeof a.email === 'string') {
        return { email: a.email, rsvp: (a.rsvp === 'yes' || a.rsvp === 'no' || a.rsvp === 'maybe') ? a.rsvp : null };
      }
      return null;
    })
    .filter(Boolean) as { email: string, rsvp: 'yes' | 'no' | 'maybe' | null }[];
}

export const RSVPResponseDialog: React.FC<RSVPResponseDialogProps> = ({ 
  open, 
  onOpenChange, 
  meeting: initialMeeting 
}) => {
  const [meeting, setMeeting] = useState(initialMeeting);
  const [attendeeResponses, setAttendeeResponses] = useState<AttendeeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const { updateMeeting } = useMeetings();

  const fetchAttendeeResponses = async () => {
    if (!meeting) return;
    
    setLoading(true);
    try {
      console.log('Fetching RSVP responses for meeting:', meeting.id);
      
      // First fetch meeting attendees
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('meeting_attendees')
        .select('id, user_id, rsvp_response, rsvp_submitted_at')
        .eq('meeting_id', meeting.id)
        .order('rsvp_submitted_at', { ascending: false, nullsFirst: false });

      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
        throw attendeesError;
      }

      console.log('Attendees data:', attendeesData);

      // Get user IDs
      const userIds = attendeesData.map(attendee => attendee.user_id);
      console.log('User IDs to fetch profiles for:', userIds);

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

      // Combine the data for registered attendees
      const registeredAttendees = attendeesData.map(attendee => {
        const profile = profilesData?.find(p => p.id === attendee.user_id);
        return {
          ...attendee,
          rsvp_response: attendee.rsvp_response as 'yes' | 'no' | 'maybe' | null,
          profiles: profile ? {
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            email: profile.email || 'No email'
          } : null,
          is_manual: false
        };
      });

      // Add manual attendees
      const manualAttendees = normalizeManualAttendees(meeting.manual_attendees).map((a) => ({
        email: a.email,
        rsvp: (a.rsvp === 'yes' || a.rsvp === 'no' || a.rsvp === 'maybe') ? a.rsvp : null
      }));

      const combinedData: AttendeeResponse[] = [
        ...registeredAttendees,
        ...manualAttendees.map((a) => ({
          id: `manual-${a.email}`,
          user_id: '',
          rsvp_response: a.rsvp,
          rsvp_submitted_at: null,
          profiles: {
            first_name: 'External',
            last_name: 'Attendee',
            email: a.email
          },
          is_manual: true
        }))
      ];
      
      console.log('Combined RSVP data:', combinedData);
      setAttendeeResponses(combinedData);
    } catch (error: any) {
      console.error('Error fetching RSVP responses:', error);
      toast({
        title: "Error",
        description: "Failed to load RSVP responses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && meeting) {
      console.log('Dialog opened for meeting:', meeting.title);
      fetchAttendeeResponses();
    }
  }, [open, meeting]);

  // Set up real-time subscription for RSVP updates
  useEffect(() => {
    if (!open || !meeting) return;

    console.log('Setting up real-time subscription for meeting:', meeting.id);
    
    const channel = supabase
      .channel(`rsvp-updates-${meeting.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_attendees',
          filter: `meeting_id=eq.${meeting.id}`
        },
        (payload) => {
          console.log('Real-time RSVP update received:', payload);
          // Refresh data when RSVP responses change
          fetchAttendeeResponses();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [open, meeting]);

  useEffect(() => {
    setMeeting(initialMeeting);
  }, [initialMeeting]);

  // Find current user's RSVP
  const myResponse = attendeeResponses.find(r => r.user_id === user?.id);

  // RSVP update handler
  const handleRSVP = async (response: 'yes' | 'no' | 'maybe') => {
    if (!meeting || !user) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('meeting_attendees')
        .update({ rsvp_response: response, rsvp_submitted_at: new Date().toISOString() })
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'RSVP Updated', description: `Your response: ${response.charAt(0).toUpperCase() + response.slice(1)}` });
      fetchAttendeeResponses();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update RSVP', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  if (!meeting) return null;

  const responseStats = {
    yes: attendeeResponses.filter(r => !r.is_manual && r.rsvp_response === 'yes').length,
    no: attendeeResponses.filter(r => !r.is_manual && r.rsvp_response === 'no').length,
    maybe: attendeeResponses.filter(r => !r.is_manual && r.rsvp_response === 'maybe').length,
    pending: attendeeResponses.filter(r => !r.is_manual && !r.rsvp_response).length,
    external: attendeeResponses.filter(r => r.is_manual).length
  };

  const getRSVPIcon = (response: 'yes' | 'no' | 'maybe' | null) => {
    switch (response) {
      case 'yes':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'no':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maybe':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRSVPBadge = (response: 'yes' | 'no' | 'maybe' | null) => {
    switch (response) {
      case 'yes':
        return <Badge className="bg-green-100 text-green-800">Yes</Badge>;
      case 'no':
        return <Badge className="bg-red-100 text-red-800">No</Badge>;
      case 'maybe':
        return <Badge className="bg-yellow-100 text-yellow-800">Maybe</Badge>;
      default:
        return <Badge variant="outline">No Response</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>RSVP Responses</span>
          </DialogTitle>
          <DialogDescription>
            View attendee responses for "{meeting.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Your RSVP Section */}
          {myResponse && (
            <Card className="mb-2">
              <CardHeader>
                <CardTitle>Your Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant={myResponse.rsvp_response === 'yes' ? 'default' : 'outline'}
                    onClick={() => handleRSVP('yes')}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Yes
                  </Button>
                  <Button
                    variant={myResponse.rsvp_response === 'no' ? 'destructive' : 'outline'}
                    onClick={() => handleRSVP('no')}
                    disabled={updating}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> No
                  </Button>
                  <Button
                    variant={myResponse.rsvp_response === 'maybe' ? 'secondary' : 'outline'}
                    onClick={() => handleRSVP('maybe')}
                    disabled={updating}
                  >
                    <Clock className="h-4 w-4 mr-1" /> Maybe
                  </Button>
                  <span className="ml-4">{getRSVPBadge(myResponse.rsvp_response)}</span>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Response Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{responseStats.yes}</span>
                </div>
                <p className="text-sm text-gray-600">Yes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">{responseStats.no}</span>
                </div>
                <p className="text-sm text-gray-600">No</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">{responseStats.maybe}</span>
                </div>
                <p className="text-sm text-gray-600">Maybe</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-gray-600">{responseStats.pending}</span>
                </div>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{responseStats.external}</span>
                </div>
                <p className="text-sm text-gray-600">External</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Responses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Responses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : attendeeResponses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendeeResponses.map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {attendee.is_manual ? (
                              <Badge variant="outline" className="text-xs">External</Badge>
                            ) : (
                              getRSVPIcon(attendee.rsvp_response)
                            )}
                            <span>
                              {attendee.profiles?.first_name || 'Unknown'} {attendee.profiles?.last_name || 'User'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{attendee.profiles?.email || 'No email'}</TableCell>
                        <TableCell>
                          {getRSVPBadge(attendee.rsvp_response)}
                        </TableCell>
                        <TableCell>
                          {attendee.is_manual ? (
                            <span className="text-gray-500">External</span>
                          ) : (
                            attendee.rsvp_submitted_at 
                              ? format(new Date(attendee.rsvp_submitted_at), 'MMM dd, h:mm a')
                              : '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No attendees found for this meeting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
