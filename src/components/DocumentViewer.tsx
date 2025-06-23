
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
    
    try {
      console.log('Starting download for:', documentProp.name, documentProp.file_path);
      
      // Show loading toast
      toast({
        title: "Starting Download",
        description: `Preparing "${documentProp.name}" for download...`
      });

      // Strategy 1: Fetch with proper headers and create blob
      try {
        const response = await fetch(documentProp.file_path, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
          },
          mode: 'cors'
        });

        if (response.ok) {
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = documentProp.name || 'download';
          link.style.display = 'none';
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
          
          toast({
            title: "Download Complete",
            description: `"${documentProp.name}" downloaded successfully`
          });
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.warn('Fetch download failed:', fetchError);
      }

      // Strategy 2: Direct link approach with proper attributes
      try {
        const link = document.createElement('a');
        link.href = documentProp.file_path;
        link.download = documentProp.name || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        // Add click handler to track success
        let downloadStarted = false;
        link.addEventListener('click', () => {
          downloadStarted = true;
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (downloadStarted) {
          toast({
            title: "Download Started",
            description: `"${documentProp.name}" download initiated`
          });
          return;
        }
      } catch (linkError) {
        console.warn('Link download failed:', linkError);
      }

      // Strategy 3: Open in new window as last resort
      try {
        const newWindow = window.open(documentProp.file_path, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          toast({
            title: "File Opened",
            description: "File opened in new tab. Use your browser's download option.",
          });
          return;
        }
      } catch (windowError) {
        console.warn('Window.open failed:', windowError);
      }

      // If all methods fail
      throw new Error('All download methods failed');
      
    } catch (error) {
      console.error('Download error:', error);
      
      // Check if it's a demo file or invalid URL
      if (!documentProp.file_path || 
          (!documentProp.file_path.includes('http') && !documentProp.file_path.startsWith('/'))) {
        toast({
          title: "Demo File",
          description: "This is a demo file. In production, files would be stored in cloud storage.",
          variant: "default"
        });
      } else {
        toast({
          title: "Download Error",
          description: "Unable to download the file. Please check your connection and try again.",
          variant: "destructive"
        });
      }
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
