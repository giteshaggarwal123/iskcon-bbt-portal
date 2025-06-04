
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useMeetings } from '@/hooks/useMeetings';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MeetingFormData {
  title: string;
  description: string;
  time: string;
  duration: string;
  type: string;
  location: string;
  attendees: string;
}

export const ScheduleMeetingDialog: React.FC<ScheduleMeetingDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } = useForm<MeetingFormData>();
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [showCalendar, setShowCalendar] = React.useState(false);
  const { createMeeting } = useMeetings();
  const { isConnected } = useMicrosoftAuth();
  
  const watchType = watch('type');

  const onSubmit = async (data: MeetingFormData) => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // For online meetings, Teams link will be auto-generated
    const meetingData = {
      ...data,
      date: selectedDate,
      location: data.type === 'online' ? 'Microsoft Teams Meeting' : data.location
    };

    const meeting = await createMeeting(meetingData);

    if (meeting) {
      reset();
      setSelectedDate(undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting and send invitations to attendees.
            {!isConnected && watchType === 'online' && (
              <span className="block mt-2 text-orange-600 text-sm">
                Connect your Microsoft account in Settings to create Teams meetings automatically.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input 
                id="title" 
                {...register('title', { required: true })}
                placeholder="e.g., Monthly Bureau Meeting"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                {...register('description')}
                placeholder="Meeting agenda and details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Input 
                  id="time" 
                  type="time"
                  {...register('time', { required: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select onValueChange={(value) => setValue('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="1hour">1 hour</SelectItem>
                    <SelectItem value="1.5hours">1.5 hours</SelectItem>
                    <SelectItem value="2hours">2 hours</SelectItem>
                    <SelectItem value="3hours">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Meeting Type</Label>
                <Select onValueChange={(value) => setValue('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>Teams Meeting</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="physical">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>Physical Meeting</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hybrid">Hybrid Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional location field - only show for physical/hybrid meetings */}
            {watchType && watchType !== 'online' && (
              <div>
                <Label htmlFor="location">
                  {watchType === 'hybrid' ? 'Physical Location' : 'Meeting Location'}
                </Label>
                <Input 
                  id="location" 
                  {...register('location', { required: watchType !== 'online' })}
                  placeholder={watchType === 'hybrid' ? 'Conference room address' : 'Conference room or venue'}
                />
              </div>
            )}

            {/* Teams meeting info for online meetings */}
            {watchType === 'online' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Teams Meeting</span>
                </div>
                <p className="text-sm text-blue-700">
                  {isConnected 
                    ? 'A Microsoft Teams meeting will be created automatically with a shareable join link and calendar event.'
                    : 'Connect your Microsoft account in Settings to automatically create Teams meetings with calendar integration.'
                  }
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="attendees">Attendees (Email addresses)</Label>
              <Textarea 
                id="attendees" 
                {...register('attendees')}
                placeholder="Enter email addresses separated by commas (e.g., user1@email.com, user2@email.com)"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                For Teams meetings, attendees will receive calendar invitations with the join link.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {watchType === 'online' ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <CalendarIcon className="h-4 w-4" />
                  )}
                  <span>
                    {watchType === 'online' ? 'Create Teams Meeting' : 'Schedule Meeting'}
                  </span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
