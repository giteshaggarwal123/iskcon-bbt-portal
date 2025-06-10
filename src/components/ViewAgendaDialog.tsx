
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, MapPin, Video, Calendar, Paperclip, Upload, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DocumentAnalytics } from './DocumentAnalytics';

interface ViewAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
}

interface MeetingFile {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  download_count: number;
  view_count: number;
}

export const ViewAgendaDialog: React.FC<ViewAgendaDialogProps> = ({ open, onOpenChange, meeting }) => {
  const [meetingFiles, setMeetingFiles] = useState<MeetingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && meeting) {
      fetchMeetingFiles();
    }
  }, [open, meeting]);

  const fetchMeetingFiles = async () => {
    if (!meeting) return;
    
    setLoadingFiles(true);
    try {
      // Use type assertion since the table is newly created
      const { data, error } = await (supabase as any)
        .from('meeting_attachments')
        .select('*')
        .eq('meeting_id', meeting.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeetingFiles(data || []);
    } catch (error) {
      console.error('Error fetching meeting files:', error);
      toast({
        title: "Error",
        description: "Failed to load meeting files",
        variant: "destructive"
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !meeting || !user) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${meeting.id}/${Date.now()}_${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('meeting-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save file metadata to database
        const { error: dbError } = await (supabase as any)
          .from('meeting_attachments')
          .insert({
            meeting_id: meeting.id,
            name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user.id
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Files Uploaded",
        description: `${files.length} file(s) uploaded successfully`,
      });

      fetchMeetingFiles();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleFileDownload = async (file: MeetingFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('meeting-attachments')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update download count
      await (supabase as any)
        .from('meeting_attachments')
        .update({ download_count: (file.download_count || 0) + 1 })
        .eq('id', file.id);

      fetchMeetingFiles();
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleFileView = async (file: MeetingFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('meeting-attachments')
        .createSignedUrl(file.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, '_blank');

      // Update view count
      await (supabase as any)
        .from('meeting_attachments')
        .update({ view_count: (file.view_count || 0) + 1 })
        .eq('id', file.id);

      fetchMeetingFiles();
    } catch (error: any) {
      console.error('Error viewing file:', error);
      toast({
        title: "View Failed",
        description: error.message || "Failed to view file",
        variant: "destructive"
      });
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const file = meetingFiles.find(f => f.id === fileId);
      if (!file) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('meeting-attachments')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await (supabase as any)
        .from('meeting_attachments')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: "File Deleted",
        description: "File deleted successfully",
      });

      fetchMeetingFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!meeting) return null;

  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  let durationText = '';
  if (hours > 0) durationText += `${hours}h `;
  if (minutes > 0) durationText += `${minutes}m`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting.title}</DialogTitle>
          <DialogDescription>
            Meeting scheduled for {format(startTime, 'MMMM dd, yyyy')} at {format(startTime, 'h:mm a')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Meeting Details</TabsTrigger>
            <TabsTrigger value="attachments" className="relative">
              Attachments
              {meetingFiles.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {meetingFiles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{durationText.trim() || '0m'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{meeting.attendees?.length || 0} attendees</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{meeting.location || 'No location specified'}</span>
              </div>
              {meeting.meeting_type && (
                <Badge variant="outline">{meeting.meeting_type}</Badge>
              )}
            </div>

            {meeting.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{meeting.description}</p>
              </div>
            )}

            {meeting.teams_join_url && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Meeting Link</h3>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Video className="h-4 w-4 text-blue-600" />
                  <a 
                    href={meeting.teams_join_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Join Microsoft Teams Meeting
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Meeting Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Start Time:</span>
                  <div className="font-medium">{format(startTime, 'MMMM dd, yyyy h:mm a')}</div>
                </div>
                <div>
                  <span className="text-gray-500">End Time:</span>
                  <div className="font-medium">{format(endTime, 'MMMM dd, yyyy h:mm a')}</div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="font-medium">{meeting.status || 'Scheduled'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">{meeting.meeting_type || 'Not specified'}</div>
                </div>
              </div>
            </div>

            {meeting.outlook_event_id && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 text-sm">This meeting has been added to your Outlook calendar</span>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Meeting Attachments</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <Button
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Attach Files'}
                </Button>
              </div>
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : meetingFiles.length > 0 ? (
              <div className="space-y-3">
                {meetingFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-gray-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{format(new Date(file.created_at), 'MMM dd, yyyy')}</span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{file.view_count || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Download className="h-3 w-3" />
                            <span>{file.download_count || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileView(file)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <DocumentAnalytics
                        documentId={file.id}
                        documentName={file.name}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDownload(file)}
                        className="h-8 px-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDelete(file.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Paperclip className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">No files attached to this meeting</p>
                <p className="text-sm text-gray-500">Upload files to share with meeting participants</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
