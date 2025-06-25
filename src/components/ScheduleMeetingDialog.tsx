import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Video, MapPin, Paperclip, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useMeetings } from '@/hooks/useMeetings';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { AttendeeSelector } from './AttendeeSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, meetingCreated?: boolean) => void;
  preselectedDate?: Date;
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

export const ScheduleMeetingDialog: React.FC<ScheduleMeetingDialogProps> = ({ 
  open, 
  onOpenChange, 
  preselectedDate 
}) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } = useForm<MeetingFormData>();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const { createMeeting } = useMeetings();
  const { isConnected } = useMicrosoftAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const watchType = watch('type');
  const watchTime = watch('time');

  // Set preselected date when dialog opens
  useEffect(() => {
    if (open && preselectedDate) {
      setSelectedDate(preselectedDate);
    }
  }, [open, preselectedDate]);

  // Enhanced time validation function
  const isTimeInPast = (timeString: string, selectedDate: Date | undefined) => {
    if (!timeString || !selectedDate) return false;
    
    const now = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only check if it's today
    if (selectedDateOnly.getTime() !== today.getTime()) return false;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // Add 5-minute buffer to current time
    const nowWithBuffer = new Date(now.getTime() + 5 * 60 * 1000);
    
    return selectedDateTime <= nowWithBuffer;
  };

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

  const handleDateSelect = (date: Date | undefined) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    setShowCalendar(false);
    
    // Clear time if switching to today and current time is in past
    if (date && watchTime) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(date);
      selectedDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly.getTime() === today.getTime() && isTimeInPast(watchTime, date)) {
        setValue('time', '');
        toast({
          title: "Time Reset",
          description: "Selected time was in the past, please choose a future time",
          variant: "destructive"
        });
      }
    }
  };

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

  const uploadMeetingFiles = async (meetingId: string) => {
    if (attachedFiles.length === 0 || !user) return;

    setUploadingFiles(true);
    try {
      for (const attachedFile of attachedFiles) {
        // Upload file to Supabase storage
        const fileExt = attachedFile.file.name.split('.').pop();
        const fileName = `${meetingId}/${Date.now()}_${attachedFile.file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('meeting-attachments')
          .upload(fileName, attachedFile.file);

        if (uploadError) throw uploadError;

        // Save file metadata to database
        const { error: dbError } = await (supabase as any)
          .from('meeting_attachments')
          .insert({
            meeting_id: meetingId,
            name: attachedFile.file.name,
            file_path: uploadData.path,
            file_size: attachedFile.file.size,
            mime_type: attachedFile.file.type,
            uploaded_by: user.id
          });

        if (dbError) throw dbError;
      }

      if (attachedFiles.length > 0) {
        toast({
          title: "Files Uploaded",
          description: `${attachedFiles.length} file(s) uploaded successfully`,
        });
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "File Upload Failed",
        description: error.message || "Failed to upload some files",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    console.log('Form submission started');
    console.log('Selected date:', selectedDate);
    console.log('Form data:', data);

    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a meeting date",
        variant: "destructive"
      });
      return;
    }

    if (!data.time) {
      toast({
        title: "Time Required",
        description: "Please select a meeting time",
        variant: "destructive"
      });
      return;
    }

    // Enhanced validation: Check if time is in the past for today
    if (isTimeInPast(data.time, selectedDate)) {
      toast({
        title: "Invalid Time",
        description: "Cannot schedule a meeting in the past. Please select a future time (at least 5 minutes from now).",
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

    // Create a proper date object with the selected date and time
    const meetingDate = new Date(selectedDate);
    const [hours, minutes] = data.time.split(':').map(Number);
    meetingDate.setHours(hours, minutes, 0, 0);

    // Final enhanced check - ensure the complete datetime is in the future with buffer
    const nowWithBuffer = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    if (meetingDate <= nowWithBuffer) {
      toast({
        title: "Invalid DateTime",
        description: "Meeting time must be at least 5 minutes in the future",
        variant: "destructive"
      });
      return;
    }

    console.log('Final meeting date/time:', meetingDate);

    const meetingData = {
      ...data,
      date: meetingDate,
      location: data.type === 'online' ? 'Microsoft Teams Meeting' : data.location,
      attendees: selectedAttendees.join(', '),
      attachments: attachedFiles,
      rsvpEnabled
    };

    console.log('Meeting data being sent:', meetingData);

    const meeting = await createMeeting(meetingData);

    if (meeting) {
      // Upload files after meeting is created
      if (attachedFiles.length > 0) {
        await uploadMeetingFiles(meeting.id);
      }

      reset();
      setSelectedDate(undefined);
      setSelectedAttendees([]);
      setAttachedFiles([]);
      setRsvpEnabled(true);
      onOpenChange(false, true); // Pass true to indicate meeting was created
    }
  };

  const handleDialogClose = () => {
    reset();
    setSelectedDate(undefined);
    setSelectedAttendees([]);
    setAttachedFiles([]);
    setRsvpEnabled(true);
    onOpenChange(false, false); // Pass false to indicate no meeting was created
  };

  // Generate minimum time for today (current time + 5 minutes buffer)
  const getMinTimeForToday = () => {
    if (!selectedDate) return '';
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    // Only apply minimum time if it's today
    if (selectedDateOnly.getTime() !== today.getTime()) return '';
    
    // Add 5-minute buffer to current time
    const minTime = new Date(now.getTime() + 5 * 60 * 1000);
    const hours = minTime.getHours().toString().padStart(2, '0');
    const minutes = minTime.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting with file attachments.
            {preselectedDate && (
              <span className="block mt-2 text-primary text-sm font-medium">
                Creating meeting for {format(preselectedDate, 'MMMM dd, yyyy')}
              </span>
            )}
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
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Time *</Label>
                <div className="relative">
                  <Input 
                    id="time" 
                    type="time"
                    min={getMinTimeForToday()}
                    {...register('time', { 
                      required: true,
                      validate: (value) => {
                        if (isTimeInPast(value, selectedDate)) {
                          return "Cannot schedule meeting in the past";
                        }
                        return true;
                      }
                    })}
                    className={cn(
                      watchTime && isTimeInPast(watchTime, selectedDate) && 
                      "border-red-500 focus:border-red-500"
                    )}
                  />
                  {watchTime && isTimeInPast(watchTime, selectedDate) && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Clock className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {watchTime && isTimeInPast(watchTime, selectedDate) && (
                  <p className="text-sm text-red-500 mt-1">
                    Selected time is in the past. Please choose a time at least 5 minutes from now.
                  </p>
                )}
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
                  disabled={isSubmitting || uploadingFiles}
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
                        type="button"
                        disabled={isSubmitting || uploadingFiles}
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
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting || uploadingFiles}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingFiles} className="bg-primary hover:bg-primary/90">
              {isSubmitting || uploadingFiles ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{uploadingFiles ? 'Uploading Files...' : 'Creating...'}</span>
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
