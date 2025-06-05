
import React from 'react';
import { DocumentUploadDialog } from './DocumentUploadDialog';

interface DocumentHeaderProps {
  currentFolderName: string;
  documentCount: number;
  onUpload: (file: File) => Promise<void>;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  currentFolderName,
  documentCount,
  onUpload
}) => {
  return (
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Document Repository</h1>
        <p className="text-gray-600">
          {currentFolderName} • {documentCount} documents
        </p>
      </div>
      
      <div className="flex space-x-2">
        <DocumentUploadDialog onUpload={onUpload} />
      </div>
    </div>
  );
};
