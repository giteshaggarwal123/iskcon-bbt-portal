
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
    // Image files
    if (mimeType.includes('image')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <img 
            src={document.file_path} 
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.appendChild(
                Object.assign(document.createElement('div'), {
                  className: 'text-center p-8',
                  innerHTML: `
                    <div class="text-red-500 mb-2">
                      <svg class="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                    <p class="text-gray-600">Unable to load image preview</p>
                    <p class="text-sm text-gray-400 mt-2">The image file may be corrupted or the path is invalid</p>
                  `
                })
              );
            }}
          />
        </div>
      );
    }
    
    // PDF files
    if (mimeType.includes('pdf')) {
      return (
        <div className="w-full h-full">
          <iframe
            src={`${document.file_path}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={document.name}
          />
        </div>
      );
    }
    
    // Text files
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
      return (
        <div className="w-full h-full bg-white p-6 overflow-auto">
          <iframe
            src={document.file_path}
            className="w-full h-full border border-gray-200 rounded"
            title={document.name}
          />
        </div>
      );
    }
    
    // Office documents (Word, Excel, PowerPoint)
    if (mimeType.includes('officedocument') || mimeType.includes('msword') || mimeType.includes('excel') || mimeType.includes('powerpoint')) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + document.file_path)}`;
      return (
        <div className="w-full h-full">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0"
            title={document.name}
          />
        </div>
      );
    }
    
    // Video files
    if (mimeType.includes('video')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video 
            controls 
            className="max-w-full max-h-full"
            src={document.file_path}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Audio files
    if (mimeType.includes('audio')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="mb-6">
              <FileText className="h-16 w-16 text-blue-500 mx-auto" />
            </div>
            <audio controls className="mb-4">
              <source src={document.file_path} type={mimeType} />
              Your browser does not support the audio element.
            </audio>
            <p className="text-gray-600">{document.name}</p>
          </div>
        </div>
      );
    }
    
    // Fallback for unsupported file types
    return (
      <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <File className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Preview Not Available</h3>
          <p className="text-gray-500 mb-4">
            This file type cannot be previewed in the browser.
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
