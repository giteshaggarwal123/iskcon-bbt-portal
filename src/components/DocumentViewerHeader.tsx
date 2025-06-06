
import React from 'react';
import { DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import { formatFileSize, formatDate } from './DocumentViewerUtils';

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
}

interface DocumentViewerHeaderProps {
  document: Document;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
  onExternalView: () => void;
  onClose: () => void;
}

export const DocumentViewerHeader: React.FC<DocumentViewerHeaderProps> = ({
  document,
  zoom,
  onZoomIn,
  onZoomOut,
  onDownload,
  onExternalView,
  onClose
}) => {
  const isImage = document.mime_type?.includes('image');

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <DialogTitle className="text-lg font-semibold truncate">
          {document.name}
        </DialogTitle>
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
          <Badge variant="secondary">
            {document.mime_type?.split('/')[1] || 'file'}
          </Badge>
          <span>{formatFileSize(document.file_size)}</span>
          <span>Created {formatDate(document.created_at)}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        {isImage && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onZoomOut}
              disabled={zoom <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">{zoom}%</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </>
        )}
        
        <Button size="sm" variant="outline" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="outline" onClick={onExternalView}>
          <ExternalLink className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
