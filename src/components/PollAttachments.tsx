
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, File } from 'lucide-react';
import { PollAttachment } from '@/hooks/usePolls';
import { usePolls } from '@/hooks/usePolls';

interface PollAttachmentsProps {
  attachments: PollAttachment[];
  onViewDocument?: (attachment: PollAttachment) => void;
}

export const PollAttachments: React.FC<PollAttachmentsProps> = ({
  attachments,
  onViewDocument
}) => {
  const { downloadAttachment } = usePolls();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return File;
    
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('image')) return Eye;
    if (mimeType.includes('document') || mimeType.includes('word')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileText;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FileText;
    
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeLabel = (mimeType: string | null) => {
    if (!mimeType) return 'File';
    
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Word';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint';
    
    return 'File';
  };

  const handleDownload = async (attachment: PollAttachment) => {
    await downloadAttachment(attachment.file_path, attachment.file_name);
  };

  const handleView = (attachment: PollAttachment) => {
    if (onViewDocument) {
      // Convert PollAttachment to document format for viewer
      const documentForViewer = {
        id: attachment.id,
        name: attachment.file_name,
        file_path: attachment.file_path,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        uploaded_by: attachment.uploaded_by,
        created_at: attachment.created_at
      };
      onViewDocument(documentForViewer);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Poll Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.mime_type);
            const canView = attachment.mime_type && (
              attachment.mime_type.includes('pdf') || 
              attachment.mime_type.includes('image') ||
              attachment.mime_type.includes('text')
            );

            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {attachment.file_name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(attachment.mime_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {canView && onViewDocument && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(attachment)}
                      className="h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(attachment)}
                    className="h-8 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
