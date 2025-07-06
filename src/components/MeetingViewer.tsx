
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: Array<{ name: string; email: string; }>;
}

interface MeetingViewerProps {
  meeting: Meeting;
}

export const MeetingViewer: React.FC<MeetingViewerProps> = ({ meeting }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>{meeting.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meeting.description && (
          <p className="text-gray-600">{meeting.description}</p>
        )}
        
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            {formatDate(meeting.start_time)} • {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
          </span>
        </div>

        {meeting.location && (
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{meeting.location}</span>
          </div>
        )}

        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4" />
            <span>{meeting.attendees.length} attendees</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingViewer;
