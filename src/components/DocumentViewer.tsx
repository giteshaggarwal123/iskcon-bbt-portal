
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewerHeader } from './DocumentViewerHeader';
import { DocumentViewerContent } from './DocumentViewerContent';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentViewTracking } from '@/hooks/useDocumentViewTracking';

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
  documentType?: 'document' | 'poll_attachment';
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document: documentProp,
  documentType = 'document'
}) => {
  const [zoom, setZoom] = useState(100);
  const { toast } = useToast();
  const { user } = useAuth();

  // Use the tracking hook with document type
  useDocumentViewTracking({
    documentId: documentProp?.id || null,
    userId: user?.id || null,
    isViewing: isOpen,
    documentType
  });

  // Reset zoom when document changes
  useEffect(() => {
    if (documentProp) {
      setZoom(100);
    }
  }, [documentProp?.id]);

  const handleDownload = () => {
    if (!documentProp) return;
    
    // Create a download link
    const link = document.createElement('a');
    link.href = documentProp.file_path;
    link.download = documentProp.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading "${documentProp.name}"`
    });
  };

  const handleExternalView = () => {
    if (!documentProp) return;
    
    // Open in new tab
    window.open(documentProp.file_path, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "External View",
      description: `Opening "${documentProp.name}" in new tab`
    });
  };

  const handleZoomIn = () => {
    setZoom(Math.min(200, zoom + 25));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(25, zoom - 25));
  };

  if (!documentProp) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <DocumentViewerHeader
            document={documentProp}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onDownload={handleDownload}
            onExternalView={handleExternalView}
            onClose={onClose}
          />
        </DialogHeader>
        
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          <DocumentViewerContent
            document={documentProp}
            zoom={zoom}
            onDownload={handleDownload}
            onExternalView={handleExternalView}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
