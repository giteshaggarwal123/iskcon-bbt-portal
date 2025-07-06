import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewerHeader } from './DocumentViewerHeader';
import { DocumentViewerContent } from './DocumentViewerContent';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentViewTracking } from '@/hooks/useDocumentViewTracking';
import { supabase } from '@/integrations/supabase/client';

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
    toast({
      title: "Downloading...",
      description: `Preparing "${documentProp.name}" for download...`
    });
    try {
      const bucket = 'documents';
      const filePath = documentProp.file_path;
      if (typeof filePath !== 'string' || !filePath.trim()) {
        toast({
          title: "Download Error",
          description: "File path is missing or invalid.",
          variant: "destructive"
        });
        return;
      }
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
      if (error || !data?.signedUrl) {
        toast({
          title: "Download Error",
          description: "Unable to generate download link.",
          variant: "destructive"
        });
        return;
      }
      // Force download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = documentProp.name;
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

  const isImage = documentProp?.mime_type?.includes('image');
  const isPDF = documentProp?.mime_type?.includes('pdf');

  if (!documentProp) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] h-[85vh] overflow-hidden p-0">
        {isPDF ? (
          <div className="w-full h-full flex flex-col">
            <div className="w-full flex-shrink-0" style={{height: 56}}>
              <div className="w-full h-full flex items-center px-4 border-b bg-white">
                <DocumentViewerHeader
                  document={documentProp}
                  zoom={zoom}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onDownload={handleDownload}
                  onExternalView={handleExternalView}
                  onClose={onClose}
                />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DocumentViewerContent
                document={documentProp}
                zoom={zoom}
                onDownload={handleDownload}
                onExternalView={handleExternalView}
                hideActions={true}
                headerHeight={56}
              />
            </div>
          </div>
        ) : (
          <>
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
            <div className={isImage ? "flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4" : "flex-1 overflow-auto bg-gray-50"}>
              <DocumentViewerContent
                document={documentProp}
                zoom={zoom}
                onDownload={handleDownload}
                onExternalView={handleExternalView}
                hideActions={true}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
