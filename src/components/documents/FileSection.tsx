
import React, { useState } from 'react';
import { FileText, MoreVertical, Download, Eye, Edit3, Copy, Trash2, Star, StarOff, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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

interface FileSectionProps {
  documents: Document[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  currentUserId?: string;
  canDeleteDocument: (document: Document) => boolean;
  onViewDocument: (document: Document) => void;
  onDownloadDocument: (document: Document) => void;
  onToggleImportant: (documentId: string, currentStatus: boolean) => void;
  onRenameDocument: (document: Document) => void;
  onCopyDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
  onMoveDocument: (documentId: string, targetFolderId: string | null) => void;
  onDragStart: (documentId: string) => void;
  viewMode?: 'card' | 'list';
}

export const FileSection: React.FC<FileSectionProps> = ({
  documents,
  userProfiles,
  currentUserId,
  canDeleteDocument,
  onViewDocument,
  onDownloadDocument,
  onToggleImportant,
  onRenameDocument,
  onCopyDocument,
  onDeleteDocument,
  onMoveDocument,
  onDragStart,
  viewMode = 'card'
}) => {
  const [draggedDocument, setDraggedDocument] = useState<string | null>(null);

  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId];
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown User';
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDragStart = (documentId: string) => {
    setDraggedDocument(documentId);
    onDragStart(documentId);
  };

  const handleDragEnd = () => {
    setDraggedDocument(null);
  };

  if (documents.length === 0) {
    return null;
  }

  if (viewMode === 'list') {
    return (
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500" />
          Documents ({documents.length})
        </h3>
        <div className="space-y-1">
          {documents.map((document) => (
            <div
              key={document.id}
              draggable
              onDragStart={() => handleDragStart(document.id)}
              onDragEnd={handleDragEnd}
              className={`bg-card border rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-move group relative flex items-center justify-between ${
                draggedDocument === document.id ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate text-sm">{document.name}</span>
                    {document.is_important && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {document.mime_type?.split('/')[1] || 'Unknown'} • {formatFileSize(document.file_size)} • 
                    Modified {format(new Date(document.updated_at), 'MMM dd, yyyy')} • 
                    by {getUserDisplayName(document.uploaded_by)}
                  </div>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onViewDocument(document)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownloadDocument(document)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleImportant(document.id, document.is_important)}>
                      {document.is_important ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          Unmark Important
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Mark Important
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRenameDocument(document)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyDocument(document.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canDeleteDocument(document) && (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDeleteDocument(document.id, document.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card view (default)
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
        <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500" />
        Documents ({documents.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            draggable
            onDragStart={() => handleDragStart(document.id)}
            onDragEnd={handleDragEnd}
            className={`bg-card border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition-colors cursor-move group relative ${
              draggedDocument === document.id ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 flex-shrink-0" />
                <span className="font-medium truncate text-sm sm:text-base">{document.name}</span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onViewDocument(document)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownloadDocument(document)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleImportant(document.id, document.is_important)}>
                      {document.is_important ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          Unmark Important
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Mark Important
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRenameDocument(document)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyDocument(document.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canDeleteDocument(document) && (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDeleteDocument(document.id, document.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {document.is_important && (
              <div className="absolute top-2 left-2">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Type: {document.mime_type?.split('/')[1] || 'Unknown'}</div>
              <div>Size: {formatFileSize(document.file_size)}</div>
              <div>Modified: {format(new Date(document.updated_at), 'MMM dd, yyyy')}</div>
              <div className="truncate">Uploaded by: {getUserDisplayName(document.uploaded_by)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
