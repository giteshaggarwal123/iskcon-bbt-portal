
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

  const handleDownload = async () => {
    if (!documentProp) return;
    
    console.log('DocumentViewer download for:', documentProp.name, documentProp.file_path);
    
    // Show loading toast
    toast({
      title: "Downloading...",
      description: `Preparing "${documentProp.name}" for download...`
    });

    try {
      // Check if this is a valid Supabase storage URL
      const isSupabaseUrl = documentProp.file_path?.includes('supabase.co/storage') || 
                           documentProp.file_path?.includes('/storage/v1/object/public/');
      
      if (!isSupabaseUrl) {
        // Handle demo files
        toast({
          title: "Demo File",
          description: "This is a demo file. Download functionality would work with real files.",
          variant: "default"
        });
        return;
      }

      // For real Supabase files, use direct download
      const link = document.createElement('a');
      link.href = documentProp.file_path;
      link.download = documentProp.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add the link to DOM, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `"${documentProp.name}" download initiated successfully`
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Unable to download the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExternalView = () => {
    if (!documentProp) return;
    
    try {
      // Open in new tab
      const newWindow = window.open(documentProp.file_path, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        toast({
          title: "External View",
          description: `Opening "${documentProp.name}" in new tab`
        });
      } else {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to open files in external tabs",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('External view error:', error);
      toast({
        title: "Error",
        description: "Unable to open file in external tab",
        variant: "destructive"
      });
    }
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
