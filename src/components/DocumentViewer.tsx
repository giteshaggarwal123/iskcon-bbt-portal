
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewerHeader } from './DocumentViewerHeader';
import { DocumentViewerContent } from './DocumentViewerContent';

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
            onDownload={handleDownload}
            onExternalView={handleExternalView}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
