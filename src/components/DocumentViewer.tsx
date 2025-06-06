
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, ExternalLink, FileText, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
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
  document: documentProp
}) => {
  const [zoom, setZoom] = useState(100);
  const { toast } = useToast();

  // Reset zoom when document changes
  useEffect(() => {
    if (documentProp) {
      setZoom(100);
    }
  }, [documentProp?.id]); // Only depend on document ID to prevent unnecessary re-renders

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
    if (!documentProp) return;
    
    // For demo purposes, show a download message
    toast({
      title: "Download Started",
      description: `Downloading "${documentProp.name}"`
    });
  };

  const handleExternalView = () => {
    if (!documentProp) return;
    
    // For demo purposes, show an external view message
    toast({
      title: "External View",
      description: `Opening "${documentProp.name}" in new tab`
    });
  };

  const renderDocumentContent = () => {
    if (!documentProp) return null;

    const mimeType = documentProp.mime_type || '';
    
    // For demo purposes, show a simulated document viewer
    return (
      <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileText className="h-24 w-24 text-blue-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Document Viewer</h3>
          <p className="text-gray-500 mb-4">
            This is a demo document viewer for "{documentProp.name}"
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {mimeType.split('/')[1] || 'file'}
              </div>
              <div>
                <span className="font-medium">Size:</span> {formatFileSize(documentProp.file_size)}
              </div>
              <div>
                <span className="font-medium">Created:</span> {formatDate(documentProp.created_at)}
              </div>
              <div>
                <span className="font-medium">Format:</span> {documentProp.name.split('.').pop()?.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-4">
            In a production system, the actual document content would be displayed here
          </div>
          <div className="flex space-x-2 justify-center">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleExternalView} size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!documentProp) return null;

  const isImage = documentProp.mime_type?.includes('image');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                {documentProp.name}
              </DialogTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <Badge variant="secondary">
                  {documentProp.mime_type?.split('/')[1] || 'file'}
                </Badge>
                <span>{formatFileSize(documentProp.file_size)}</span>
                <span>Created {formatDate(documentProp.created_at)}</span>
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
