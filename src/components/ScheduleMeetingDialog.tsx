
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Video, MapPin, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';
import { useMeetings } from '@/hooks/useMeetings';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { AttendeeSelector } from './AttendeeSelector';
import { useToast } from '@/hooks/use-toast';

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
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
}

export const ScheduleMeetingDialog: React.FC<ScheduleMeetingDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } = useForm<MeetingFormData>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  
  const { createMeeting } = useMeetings();
  const { isConnected } = useMicrosoftAuth();
  const { toast } = useToast();
  
  const watchType = watch('type');

  // File upload constraints
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (attachedFiles.length + files.length > MAX_FILES) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${MAX_FILES} files allowed`,
        variant: "destructive"
      });
      return;
    }

    const validFiles: AttachedFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
        return;
      }

      validFiles.push({
        file,
        name: file.name,
        size: file.size
      });
    });

    if (errors.length > 0) {
      toast({
        title: "File Upload Errors",
        description: errors.join(', '),
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: MeetingFormData) => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a meeting date",
        variant: "destructive"
      });
      return;
    }

    if (selectedAttendees.length === 0) {
      toast({
        title: "Attendees Required",
        description: "Please select at least one attendee",
        variant: "destructive"
      });
      return;
    }

    const meetingData = {
      ...data,
      date: selectedDate,
      location: data.type === 'online' ? 'Microsoft Teams Meeting' : data.location,
      attendees: selectedAttendees.join(', '),
      attachments: attachedFiles,
      rsvpEnabled
    };

    const meeting = await createMeeting(meetingData);

    if (meeting) {
      reset();
      setSelectedDate(undefined);
      setSelectedAttendees([]);
      setAttachedFiles([]);
      setRsvpEnabled(true);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting with Teams integration, attendee management, and file attachments.
            {!isConnected && watchType === 'online' && (
              <span className="block mt-2 text-orange-600 text-sm">
                Connect your Microsoft account in Settings to create Teams meetings automatically.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Meeting Title *</Label>
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
                <Label>Date *</Label>
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
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Time *</Label>
                <Input 
                  id="time" 
                  type="time"
                  {...register('time', { required: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration *</Label>
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
                <Label htmlFor="type">Meeting Type *</Label>
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

            {watchType && watchType !== 'online' && (
              <div>
                <Label htmlFor="location">
                  {watchType === 'hybrid' ? 'Physical Location *' : 'Meeting Location *'}
                </Label>
                <Input 
                  id="location" 
                  {...register('location', { required: watchType !== 'online' })}
                  placeholder={watchType === 'hybrid' ? 'Conference room address' : 'Conference room or venue'}
                />
              </div>
            )}

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

            {/* Attendee Selector */}
            <AttendeeSelector
              selectedAttendees={selectedAttendees}
              onAttendeesChange={setSelectedAttendees}
              placeholder="Select meeting attendees..."
            />

            {/* File Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>File Attachments</Label>
                <span className="text-xs text-gray-500">
                  Max {MAX_FILES} files, 10MB each
                </span>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.pptx,.xlsx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileAttachment}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to attach files or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF, DOCX, PPTX, XLSX, TXT, JPG, PNG
                    </p>
                  </div>
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attached Files:</p>
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RSVP Settings */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rsvp"
                checked={rsvpEnabled}
                onChange={(e) => setRsvpEnabled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="rsvp">Enable RSVP (attendees can respond Yes/No/Maybe)</Label>
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
