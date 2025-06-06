
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
  const mimeType = document.mime_type || '';
  
  const renderFilePreview = () => {
    // For now, show a consistent preview unavailable message for all file types
    // since the actual file URLs are not accessible
    return (
      <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <File className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Preview Not Available</h3>
          <p className="text-gray-500 mb-4">
            File preview is not available in this demo environment.
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
          <div className="flex space-x-2 justify-center">
            <Button onClick={onDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={onExternalView} size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
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
