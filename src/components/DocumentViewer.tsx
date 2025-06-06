import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    uploaded_by: string;
    created_at: string;
  } | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (!document) return;
    
    const link = window.document.createElement('a');
    link.href = document.file_path;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading "${document.name}"`
    });
  };

  const handleExternalView = () => {
    if (!document) return;
    window.open(document.file_path, '_blank');
  };

  const renderDocumentContent = () => {
    if (!document) return null;

    const mimeType = document.mime_type || '';
    
    // PDF documents
    if (mimeType.includes('pdf')) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <iframe
            src={`${document.file_path}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
            className="w-full h-full rounded-lg border-0"
            style={{ minHeight: '600px' }}
            title={document.name}
          />
        </div>
      );
    }

    // Image files
    if (mimeType.includes('image')) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center p-4">
          <img
            src={document.file_path}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      );
    }

    // Text files
    if (mimeType.includes('text') || document.name.endsWith('.txt')) {
      return (
        <div className="w-full h-full bg-white rounded-lg p-6 overflow-auto">
          <iframe
            src={document.file_path}
            className="w-full h-full border-0"
            style={{ minHeight: '600px' }}
            title={document.name}
          />
        </div>
      );
    }

    // Other file types - show preview with option to download
    return (
      <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center p-8">
        <FileText className="h-24 w-24 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{document.name}</h3>
        <p className="text-gray-500 mb-6 text-center">
          This file type cannot be previewed directly.<br />
          Click the buttons below to download or view in a new tab.
        </p>
        <div className="flex space-x-3">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleExternalView}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  };

  if (!document) return null;

  const isImage = document.mime_type?.includes('image');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-white">
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
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">{zoom}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleExternalView}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          {renderDocumentContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
