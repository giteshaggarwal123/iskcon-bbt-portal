
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
  zoom?: number;
  onDownload: () => void;
  onExternalView: () => void;
}

export const DocumentViewerContent: React.FC<DocumentViewerContentProps> = ({
  document,
  zoom = 100,
  onDownload,
  onExternalView
}) => {
  console.log('DocumentViewerContent - Document:', document);
  console.log('DocumentViewerContent - File path:', document.file_path);
  console.log('DocumentViewerContent - MIME type:', document.mime_type);
  
  const mimeType = document.mime_type || '';
  
  const renderFilePreview = () => {
    console.log('Rendering file preview for:', document.name, 'Type:', mimeType);
    
    // Check if this is a Supabase storage URL (public URL)
    const isSupabaseStorage = document.file_path.includes('supabase.co/storage') || 
                             document.file_path.includes('/storage/v1/object/public/');
    
    console.log('Is Supabase storage URL?', isSupabaseStorage);
    
    if (!isSupabaseStorage) {
      // Show demo message for non-storage paths
      return (
        <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <File className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Demo Environment</h3>
            <p className="text-gray-500 mb-4">
              This document was created before storage was configured.
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
              File path: {document.file_path}
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

    // Handle real files from Supabase Storage
    if (mimeType.includes('image')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <img 
            src={document.file_path} 
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center'
            }}
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
            src={`${document.file_path}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}`}
            className="w-full h-full border-0"
            title={document.name}
            onError={() => {
              console.error('PDF failed to load:', document.file_path);
            }}
          />
        </div>
      );
    }

    if (mimeType.includes('text')) {
      return (
        <div className="w-full h-full p-4 bg-white overflow-auto">
          <iframe
            src={document.file_path}
            className="w-full h-full border-0"
            title={document.name}
            style={{ fontSize: `${zoom}%` }}
          />
        </div>
      );
    }

    // For Office documents (Word, Excel, PowerPoint), use multiple viewers with fallbacks
    if (mimeType.includes('word') || mimeType.includes('document') || 
        mimeType.includes('spreadsheet') || mimeType.includes('excel') ||
        mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      
      return (
        <div className="w-full h-full">
          <OfficeDocumentViewer 
            fileUrl={document.file_path} 
            fileName={document.name}
            mimeType={mimeType}
            onDownload={onDownload}
            onExternalView={onExternalView}
          />
        </div>
      );
    }
    
    // Fallback for other file types - show download interface
    return (
      <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileText className="h-24 w-24 text-blue-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">File Ready</h3>
          <p className="text-gray-500 mb-4">
            Click download to access this {mimeType.split('/')[1] || 'file'} file.
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

// Separate component for Office documents with multiple viewer options
const OfficeDocumentViewer: React.FC<{
  fileUrl: string;
  fileName: string;
  mimeType: string;
  onDownload: () => void;
  onExternalView: () => void;
}> = ({ fileUrl, fileName, mimeType, onDownload, onExternalView }) => {
  const [viewerError, setViewerError] = React.useState(false);
  const [currentViewer, setCurrentViewer] = React.useState<'office' | 'google' | 'fallback'>('office');

  const handleViewerError = () => {
    console.error('Office viewer failed, trying Google viewer');
    if (currentViewer === 'office') {
      setCurrentViewer('google');
    } else if (currentViewer === 'google') {
      setCurrentViewer('fallback');
      setViewerError(true);
    }
  };

  // Try Office Online viewer first
  if (currentViewer === 'office' && !viewerError) {
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    
    return (
      <iframe
        src={officeViewerUrl}
        className="w-full h-full border-0"
        title={fileName}
        onError={handleViewerError}
        onLoad={(e) => {
          // Check if iframe loaded successfully
          try {
            const iframe = e.target as HTMLIFrameElement;
            iframe.onload = () => {
              console.log('Office viewer loaded successfully');
            };
          } catch (error) {
            console.error('Office viewer error:', error);
            handleViewerError();
          }
        }}
      />
    );
  }

  // Try Google Docs viewer as fallback
  if (currentViewer === 'google' && !viewerError) {
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    
    return (
      <iframe
        src={googleViewerUrl}
        className="w-full h-full border-0"
        title={fileName}
        onError={handleViewerError}
      />
    );
  }

  // Final fallback - show download interface
  return (
    <div className="w-full h-full bg-white rounded-lg border flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <FileText className="h-24 w-24 text-blue-500 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Document Preview Unavailable</h3>
        <p className="text-gray-500 mb-4">
          Unable to preview this {mimeType.includes('word') ? 'Word' : mimeType.includes('excel') ? 'Excel' : 'Office'} document online. 
          Please download to view.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-sm">
            <div className="mb-2">
              <span className="font-medium">File:</span> {fileName}
            </div>
            <div>
              <span className="font-medium">Type:</span> {mimeType.includes('word') ? 'Microsoft Word' : 
                                                          mimeType.includes('excel') ? 'Microsoft Excel' : 
                                                          mimeType.includes('powerpoint') ? 'Microsoft PowerPoint' : 'Office Document'}
            </div>
          </div>
        </div>
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
