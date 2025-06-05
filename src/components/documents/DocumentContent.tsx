
import React from 'react';
import { FileText } from 'lucide-react';
import { DocumentTable } from './DocumentTable';
import { DocumentUploadDialog } from './DocumentUploadDialog';

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  folder: string | null;
  folder_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  is_important: boolean;
  is_hidden: boolean;
}

interface DocumentContentProps {
  filteredDocuments: Document[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  currentUserId: string | undefined;
  canDeleteDocument: (document: Document) => boolean;
  onViewDocument: (document: Document) => void;
  onDownloadDocument: (document: Document) => void;
  onToggleImportant: (documentId: string, currentStatus: boolean) => void;
  onRenameDocument: (document: Document) => void;
  onCopyDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
  onUpload: (file: File) => Promise<void>;
  searchTerm: string;
  typeFilter: string;
  peopleFilter: string;
  dateFilter: string;
  getCurrentFolderName: () => string;
}

export const DocumentContent: React.FC<DocumentContentProps> = ({
  filteredDocuments,
  userProfiles,
  currentUserId,
  canDeleteDocument,
  onViewDocument,
  onDownloadDocument,
  onToggleImportant,
  onRenameDocument,
  onCopyDocument,
  onDeleteDocument,
  onUpload,
  searchTerm,
  typeFilter,
  peopleFilter,
  dateFilter,
  getCurrentFolderName
}) => {
  if (filteredDocuments.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || typeFilter !== 'all' || peopleFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : `No documents in ${getCurrentFolderName()} folder. Upload your first document to get started.`}
          </p>
          {!searchTerm && (
            <DocumentUploadDialog onUpload={onUpload} />
          )}
        </div>
      </div>
    );
  }

  return (
    <DocumentTable
      documents={filteredDocuments}
      userProfiles={userProfiles}
      currentUserId={currentUserId}
      canDeleteDocument={canDeleteDocument}
      onViewDocument={onViewDocument}
      onDownloadDocument={onDownloadDocument}
      onToggleImportant={onToggleImportant}
      onRenameDocument={onRenameDocument}
      onCopyDocument={onCopyDocument}
      onDeleteDocument={onDeleteDocument}
    />
  );
};
