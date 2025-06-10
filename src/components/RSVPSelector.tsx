
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RSVPSelectorProps {
  meeting: any;
  onResponseUpdate?: () => void;
}

export const RSVPSelector: React.FC<RSVPSelectorProps> = ({ meeting, onResponseUpdate }) => {
  const [currentResponse, setCurrentResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (meeting && user) {
      fetchCurrentResponse();
    }
  }, [meeting, user]);

  const fetchCurrentResponse = async () => {
    if (!meeting || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .select('rsvp_response')
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data) {
        setCurrentResponse(data.rsvp_response as 'yes' | 'no' | 'maybe' | null);
      }
    } catch (error: any) {
      console.error('Error fetching RSVP response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async () => {
    if (!meeting || !user || !currentResponse) return;

    setSubmitting(true);
    try {
      // First, check if user is already an attendee
      const { data: existingAttendee, error: checkError } = await supabase
        .from('meeting_attendees')
        .select('id')
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const now = new Date().toISOString();

      if (existingAttendee) {
        // Update existing attendee record
        const { error: updateError } = await supabase
          .from('meeting_attendees')
          .update({
            rsvp_response: currentResponse,
            rsvp_submitted_at: now
          })
          .eq('id', existingAttendee.id);

        if (updateError) throw updateError;
      } else {
        // Create new attendee record
        const { error: insertError } = await supabase
          .from('meeting_attendees')
          .insert({
            meeting_id: meeting.id,
            user_id: user.id,
            rsvp_response: currentResponse,
            rsvp_submitted_at: now,
            status: 'pending'
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "RSVP Submitted",
        description: `Your response "${currentResponse}" has been saved successfully.`
      });

      // Notify parent component to refresh data
      if (onResponseUpdate) {
        onResponseUpdate();
      }
    } catch (error: any) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to submit your RSVP response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getResponseIcon = (response: 'yes' | 'no' | 'maybe') => {
    switch (response) {
      case 'yes':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'no':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maybe':
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getResponseBadge = (response: 'yes' | 'no' | 'maybe' | null) => {
    if (!response) return <Badge variant="outline">No Response</Badge>;
    
    switch (response) {
      case 'yes':
        return <Badge className="bg-green-100 text-green-800">Yes</Badge>;
      case 'no':
        return <Badge className="bg-red-100 text-red-800">No</Badge>;
      case 'maybe':
        return <Badge className="bg-yellow-100 text-yellow-800">Maybe</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Users className="h-5 w-5" />
          <span>RSVP for this Meeting</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Response:</span>
          {getResponseBadge(currentResponse)}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Select your response:</Label>
          <RadioGroup
            value={currentResponse || ""}
            onValueChange={(value) => setCurrentResponse(value as 'yes' | 'no' | 'maybe')}
            className="space-y-2"
          >
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="flex items-center space-x-2 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Yes, I will attend</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="flex items-center space-x-2 cursor-pointer">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>No, I cannot attend</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="maybe" id="maybe" />
              <Label htmlFor="maybe" className="flex items-center space-x-2 cursor-pointer">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>Maybe, I'm not sure</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleResponseSubmit}
          disabled={!currentResponse || submitting}
          className="w-full"
        >
          {submitting ? 'Submitting...' : 'Submit RSVP Response'}
        </Button>
      </CardContent>
    </Card>
  );
};
