import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  FolderOpen, 
  MoreVertical, 
  Download, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Star, 
  StarOff,
  Move,
  Lock
} from 'lucide-react';
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
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

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

  const handleMoveDocumentDialog = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setMoveDialogOpen(true);
  };

  const handleMoveDocumentConfirm = (targetFolderId: string | null) => {
    if (selectedDocumentId) {
      onMoveDocument(selectedDocumentId, targetFolderId);
      setMoveDialogOpen(false);
      setSelectedDocumentId(null);
    }
  };

  const handleDeleteFolderAction = async (folderId: string, folderName: string) => {
    const success = await onDeleteFolder(folderId);
    if (success) {
      // Handle success if needed
    }
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[250px] sm:min-w-[300px]">Name</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[100px]">Type</TableHead>
              <TableHead className="hidden md:table-cell min-w-[80px]">Size</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[120px]">Modified</TableHead>
              <TableHead className="hidden xl:table-cell min-w-[150px]">Uploaded by</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Render folders first */}
            {folders.map((folder) => (
              <TableRow 
                key={`folder-${folder.id}`} 
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onFolderClick(folder.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {folder.is_locked ? (
                        <Lock className="h-5 w-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <FolderOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      )}
                      <span className={`truncate ${folder.is_locked ? 'text-red-700 font-semibold' : ''}`}>
                        {folder.name}
                      </span>
                    </div>
                    {folder.is_locked && (
                      <Badge variant="destructive" className="text-xs">
                        LOCKED
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  Folder
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  —
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {format(new Date(folder.updated_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground">
                  {getUserDisplayName(folder.created_by)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canAccessLockedFolders && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteFolderAction(folder.id, folder.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {/* Render documents */}
            {documents.map((document) => (
              <TableRow key={document.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{document.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {document.mime_type?.split('/')[1] || 'Unknown'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {format(new Date(document.updated_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground">
                  {getUserDisplayName(document.uploaded_by)}
                </TableCell>
                <TableCell className="relative" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                      <DropdownMenuItem onClick={() => handleMoveDocumentDialog(document.id)}>
                        <Move className="h-4 w-4 mr-2" />
                        Move to
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Move to Folder Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Document</DialogTitle>
            <DialogDescription>
              Select the folder to move the document to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="folder">Target Folder</Label>
            <Select onValueChange={(value) => handleMoveDocumentConfirm(value === "root" ? null : value)}>
              <SelectTrigger className="w-[100%]">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No Folder)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
