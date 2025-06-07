
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Image, File } from 'lucide-react';
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

interface DocumentViewerContentProps {
  document: Document;
  onDownload: () => void;
  onExternalView: () => void;
}

export const DocumentViewerContent: React.FC<DocumentViewerContentProps> = ({
  document,
  onDownload,
  onExternalView
}) => {
  console.log('DocumentViewerContent - Document:', document);
  console.log('DocumentViewerContent - File path:', document.file_path);
  console.log('DocumentViewerContent - MIME type:', document.mime_type);
  
  const mimeType = document.mime_type || '';
  
  const renderFilePreview = () => {
    console.log('Rendering file preview for:', document.name, 'Type:', mimeType);
    
    // Check if this looks like a real file URL or a placeholder
    const isPlaceholderPath = document.file_path.startsWith('/uploads/') || 
                             !document.file_path.startsWith('http');
    
    console.log('Is placeholder path?', isPlaceholderPath);
    
    if (isPlaceholderPath) {
      // Show demo message for placeholder paths
      return (
        <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <File className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Demo Environment</h3>
            <p className="text-gray-500 mb-4">
              This is a demo system. File storage is not configured yet.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {mimeType.split('/')[1] || 'file'}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {formatFileSize(document.file_size)}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(document.created_at)}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {document.name.split('.').pop()?.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-4">
              Debug info: {document.file_path}
            </div>
            <div className="flex space-x-2 justify-center">
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download (Demo)
              </Button>
              <Button onClick={onExternalView} size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View (Demo)
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // If it's a real URL, try to render the file
    if (mimeType.includes('image')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <img 
            src={document.file_path} 
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Image failed to load:', document.file_path);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', document.file_path);
            }}
          />
        </div>
      );
    }
    
    if (mimeType.includes('pdf')) {
      return (
        <div className="w-full h-full">
          <iframe
            src={`${document.file_path}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={document.name}
            onError={() => {
              console.error('PDF failed to load:', document.file_path);
            }}
          />
        </div>
      );
    }
    
    // Fallback for other file types with real URLs
    return (
      <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileText className="h-24 w-24 text-blue-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">File Ready</h3>
          <p className="text-gray-500 mb-4">
            Click download to access this {mimeType.split('/')[1] || 'file'} file.
          </p>
          <div className="flex space-x-2 justify-center">
            <Button onClick={onDownload} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={onExternalView} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open External
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {renderFilePreview()}
    </div>
  );
};
