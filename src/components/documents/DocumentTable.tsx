
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
import { FileText, Download, Trash2, Eye, Edit, Copy, Star, MoreHorizontal } from 'lucide-react';
import { DocumentAnalytics } from '../DocumentAnalytics';

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  folder: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  is_important: boolean;
  is_hidden: boolean;
}

interface DocumentTableProps {
  documents: Document[];
  userProfiles: {[key: string]: {first_name: string, last_name: string}};
  currentUserId: string | undefined;
  canDeleteDocument: (document: Document) => boolean;
  onViewDocument: (document: Document) => void;
  onDownloadDocument: (document: Document) => void;
  onToggleImportant: (documentId: string, currentStatus: boolean) => void;
  onRenameDocument: (document: Document) => void;
  onCopyDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, documentName: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  userProfiles,
  currentUserId,
  canDeleteDocument,
  onViewDocument,
  onDownloadDocument,
  onToggleImportant,
  onRenameDocument,
  onCopyDocument,
  onDeleteDocument
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
          {documents.map((document) => (
            <TableRow 
              key={document.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onViewDocument(document)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  {getFileIcon(document.mime_type)}
                  {document.is_important && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{document.name}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {document.folder || 'general'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {document.mime_type?.split('/')[1] || 'file'}
                </Badge>
              </TableCell>
              <TableCell>{formatFileSize(document.file_size)}</TableCell>
              <TableCell>{formatDate(document.updated_at || document.created_at)}</TableCell>
              <TableCell>{getUserDisplayName(document.uploaded_by)}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(document);
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
                      onDownloadDocument(document);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  
                  <DocumentAnalytics 
                    documentId={document.id}
                    documentName={document.name}
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
                          onToggleImportant(document.id, document.is_important);
                        }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {document.is_important ? 'Unmark Important' : 'Mark Important'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameDocument(document);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyDocument(document.id);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {canDeleteDocument(document) && (
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
                                Are you sure you want to move "{document.name}" to the recycle bin? You can restore it from Settings &gt; Recycle Bin within 30 days.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteDocument(document.id, document.name);
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
