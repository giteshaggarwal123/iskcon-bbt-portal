
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { FolderSection } from './FolderSection';
import { FileSection } from './FileSection';
import { DragDropZone } from './DragDropZone';

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

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  is_locked: boolean;
}

interface DocumentTableProps {
  documents: Document[];
  folders: Folder[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  currentUserId?: string;
  canDeleteDocument: (document: Document) => boolean;
  onViewDocument: (document: Document) => void;
  onDownloadDocument: (document: Document) => void;
  onToggleImportant: (documentId: string, currentStatus: boolean) => void;
  onRenameDocument: (document: Document) => void;
  onCopyDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
  onDeleteFolder: (folderId: string) => Promise<boolean>;
  onFolderClick: (folderId: string) => void;
  onMoveDocument: (documentId: string, targetFolderId: string | null) => void;
  currentFolderId?: string | null;
  canAccessLockedFolders?: boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  folders,
  userProfiles,
  currentUserId,
  canDeleteDocument,
  onViewDocument,
  onDownloadDocument,
  onToggleImportant,
  onRenameDocument,
  onCopyDocument,
  onDeleteDocument,
  onDeleteFolder,
  onFolderClick,
  onMoveDocument,
  currentFolderId,
  canAccessLockedFolders = false
}) => {
  const [draggedDocumentId, setDraggedDocumentId] = useState<string | null>(null);

  const handleDragStart = (documentId: string) => {
    setDraggedDocumentId(documentId);
  };

  const handleMoveDocument = (documentId: string, targetFolderId: string | null) => {
    onMoveDocument(documentId, targetFolderId);
    setDraggedDocumentId(null);
  };

  return (
    <div className="bg-card rounded-lg border p-3 sm:p-6">
      {/* Folders Section */}
      <FolderSection
        folders={folders}
        userProfiles={userProfiles}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
        canAccessLockedFolders={canAccessLockedFolders}
      />

      {/* Documents Section */}
      <FileSection
        documents={documents}
        userProfiles={userProfiles}
        currentUserId={currentUserId}
        canDeleteDocument={canDeleteDocument}
        onViewDocument={onViewDocument}
        onDownloadDocument={onDownloadDocument}
        onToggleImportant={onToggleImportant}
        onRenameDocument={onRenameDocument}
        onCopyDocument={onCopyDocument}
        onDeleteDocument={onDeleteDocument}
        onMoveDocument={onMoveDocument}
        onDragStart={handleDragStart}
      />

      {/* Empty State */}
      {documents.length === 0 && folders.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">No documents or folders found</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Get started by uploading your first document or creating a folder
          </p>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <DragDropZone
        folders={folders}
        onMoveDocument={handleMoveDocument}
        draggedDocumentId={draggedDocumentId}
        canAccessLockedFolders={canAccessLockedFolders}
      />
    </div>
  );
};
