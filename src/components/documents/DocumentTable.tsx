
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, Trash2, Eye, Edit, Copy, Star, MoreHorizontal, Folder, FolderOpen } from 'lucide-react';
import { DocumentAnalytics } from '../DocumentAnalytics';

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
}

interface DocumentTableProps {
  documents: Document[];
  folders: Folder[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  currentUserId: string | undefined;
  canDeleteDocument: (document: Document) => boolean;
  onViewDocument: (document: Document) => void;
  onDownloadDocument: (document: Document) => void;
  onToggleImportant: (documentId: string, currentStatus: boolean) => void;
  onRenameDocument: (document: Document) => void;
  onCopyDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
  onDeleteFolder: (folderId: string) => Promise<boolean>;
  onFolderClick: (folderId: string) => void;
}

type TableItem = {
  id: string;
  name: string;
  type: 'document' | 'folder';
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  created_by?: string;
  size?: number | null;
  mime_type?: string | null;
  is_important?: boolean;
} & (Document | Folder);

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
  onFolderClick
}) => {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="h-4 w-4 text-green-500" />;
    if (mimeType.includes('image')) return <FileText className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4" />;
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === currentUserId) return 'You';
    const profile = userProfiles[userId];
    if (profile && (profile.first_name || profile.last_name)) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }
    return 'User';
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const success = await onDeleteFolder(folderId);
    if (success) {
      // Success toast is handled in the parent component
    }
  };

  // Combine documents and folders into a single array
  const combinedItems: TableItem[] = [
    ...folders.map(folder => ({
      ...folder,
      type: 'folder' as const,
      size: null,
      mime_type: null,
      is_important: false
    })),
    ...documents.map(document => ({
      ...document,
      type: 'document' as const,
      size: document.file_size,
      created_by: document.uploaded_by
    }))
  ];

  // Sort combined items: folders first, then by name
  const sortedItems = combinedItems.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead>Modified By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => (
            <TableRow 
              key={`${item.type}-${item.id}`}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                if (item.type === 'folder') {
                  onFolderClick(item.id);
                } else {
                  onViewDocument(item as Document);
                }
              }}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  {item.type === 'folder' ? (
                    <Folder className="h-4 w-4 text-blue-500" />
                  ) : (
                    <>
                      {getFileIcon(item.mime_type || null)}
                      {item.is_important && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  {item.type === 'document' && (
                    <span className="text-xs text-gray-500 capitalize">
                      {(item as Document).folder || 'general'}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {item.type === 'folder' ? 'folder' : (item.mime_type?.split('/')[1] || 'file')}
                </Badge>
              </TableCell>
              <TableCell>
                {item.type === 'folder' ? '—' : formatFileSize(item.size)}
              </TableCell>
              <TableCell>{formatDate(item.updated_at || item.created_at)}</TableCell>
              <TableCell>
                {getUserDisplayName(item.type === 'folder' ? (item as Folder).created_by : (item as Document).uploaded_by)}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-2">
                  {item.type === 'document' ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDocument(item as Document);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadDocument(item as Document);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      
                      <DocumentAnalytics 
                        documentId={item.id}
                        documentName={item.name}
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleImportant(item.id, item.is_important || false);
                            }}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {item.is_important ? 'Unmark Important' : 'Mark Important'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onRenameDocument(item as Document);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyDocument(item.id);
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canDeleteDocument(item as Document) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Move to Trash
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Move to Recycle Bin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to move "{item.name}" to the recycle bin? You can restore it from Settings &gt; Recycle Bin within 30 days.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteDocument(item.id, item.name);
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Move to Trash
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    // Folder actions
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onFolderClick(item.id);
                          }}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Open Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Folder
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                Make sure the folder is empty before deleting.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(item.id, item.name);
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
