
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadDialogProps {
  onUpload: (file: File, folderId?: string) => Promise<void>;
  currentFolderId?: string | null;
}

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({ 
  onUpload, 
  currentFolderId 
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(selectedFile, currentFolderId || undefined);
      setSelectedFile(null);
      setUploadDialogOpen(false);
      toast({
        title: "Upload Successful",
        description: `"${selectedFile.name}" has been uploaded successfully`
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word') || file.type.includes('document')) return '📝';
    if (file.type.includes('sheet') || file.type.includes('excel')) return '📊';
    if (file.type.includes('image')) return '🖼️';
    if (file.type.includes('video')) return '🎥';
    if (file.type.includes('audio')) return '🎵';
    return '📎';
  };

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto justify-center documents-action-btn bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          <span>Upload Document</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Upload New Document
          </DialogTitle>
          <DialogDescription>
            Select a file to upload to the document repository
            {currentFolderId && " (will be uploaded to current folder)"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">Select File</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:transition-colors cursor-pointer"
                disabled={isUploading}
              />
            </div>
            {selectedFile && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-muted">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(selectedFile)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
