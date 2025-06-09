
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
}

export const RSVPResponseDialog: React.FC<RSVPResponseDialogProps> = ({ 
  open, 
  onOpenChange, 
  meeting 
}) => {
  const [attendeeResponses, setAttendeeResponses] = useState<AttendeeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && meeting) {
      fetchAttendeeResponses();
    }
  }, [open, meeting]);

  const fetchAttendeeResponses = async () => {
    if (!meeting) return;
    
    setLoading(true);
    try {
      // First fetch meeting attendees
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('meeting_attendees')
        .select('id, user_id, rsvp_response, rsvp_submitted_at')
        .eq('meeting_id', meeting.id)
        .order('rsvp_submitted_at', { ascending: false, nullsFirst: false });

      if (attendeesError) throw attendeesError;

      if (!attendeesData || attendeesData.length === 0) {
        setAttendeeResponses([]);
        return;
      }

      // Get user IDs
      const userIds = attendeesData.map(attendee => attendee.user_id);

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const combinedData = attendeesData.map(attendee => {
        const profile = profilesData?.find(p => p.id === attendee.user_id);
        return {
          ...attendee,
          rsvp_response: attendee.rsvp_response as 'yes' | 'no' | 'maybe' | null,
          profiles: profile ? {
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            email: profile.email || 'No email'
          } : null
        };
      });
      
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

  if (!meeting) return null;

  const responseStats = {
    yes: attendeeResponses.filter(r => r.rsvp_response === 'yes').length,
    no: attendeeResponses.filter(r => r.rsvp_response === 'no').length,
    maybe: attendeeResponses.filter(r => r.rsvp_response === 'maybe').length,
    pending: attendeeResponses.filter(r => !r.rsvp_response).length
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
          {/* Response Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                            {getRSVPIcon(attendee.rsvp_response)}
                            <span>
                              {attendee.profiles?.first_name || 'Unknown'} {attendee.profiles?.last_name || 'User'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{attendee.profiles?.email || 'No email'}</TableCell>
                        <TableCell>{getRSVPBadge(attendee.rsvp_response)}</TableCell>
                        <TableCell>
                          {attendee.rsvp_submitted_at 
                            ? format(new Date(attendee.rsvp_submitted_at), 'MMM dd, h:mm a')
                            : '-'
                          }
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
