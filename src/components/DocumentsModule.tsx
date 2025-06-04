
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@/components/ui/context-menu';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Upload, Search, Download, Trash2, Eye, Plus, Folder, Move, Edit, Copy, List, Star, StarOff, Grid3X3 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { DocumentAnalytics } from './DocumentAnalytics';
import { CreateFolderDialog } from './CreateFolderDialog';
import { supabase } from '@/integrations/supabase/client';

export const DocumentsModule: React.FC = () => {
  const { documents, folders, loading, uploadDocument, deleteDocument, moveDocument, createFolder, searchDocuments, fetchDocuments } = useDocuments();
  const { user } = useAuth();
  const { canDeleteContent, isSuperAdmin } = useUserRole();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  // Track document views
  const trackDocumentView = async (documentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('document_views')
        .insert({
          document_id: documentId,
          user_id: user.id,
          view_started_at: new Date().toISOString(),
          completion_percentage: 0,
          last_page_viewed: 1
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking document view:', error);
    }
  };

  const toggleImportant = async (documentId: string, isImportant: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_important: !isImportant })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document ${!isImportant ? 'marked as important' : 'unmarked as important'}`
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    await uploadDocument(selectedFile, 'general');
    setSelectedFile(null);
    setUploadDialogOpen(false);
  };

  const handleViewDocument = (documentId: string, documentName: string) => {
    trackDocumentView(documentId);
    // Simulate opening document - in real implementation this would open the file
    window.open('#', '_blank');
    toast({
      title: "Document Opened",
      description: `Opening "${documentName}". Document view has been tracked.`
    });
  };

  const handleDownloadDocument = (documentId: string, documentName: string) => {
    // Create a temporary download link
    const link = document.createElement('a');
    link.href = '#'; // In real implementation, this would be the actual file URL
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading "${documentName}"`
    });
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleFolderCreated = async (folderName: string) => {
    try {
      await createFolder(folderName);
      toast({
        title: "Success",
        description: `Folder "${folderName}" created successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    searchDocuments(term);
  };

  const handleMoveDocument = async () => {
    if (!documentToMove || !selectedFolder) return;
    
    try {
      await moveDocument(documentToMove, selectedFolder);
      setMoveDialogOpen(false);
      setDocumentToMove(null);
      setSelectedFolder('');
      toast({
        title: "Success",
        description: "Document moved successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to move document",
        variant: "destructive"
      });
    }
  };

  const handleCopyDocument = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          name: `Copy of ${document.name}`,
          file_path: document.file_path,
          file_size: document.file_size,
          mime_type: document.mime_type,
          folder: document.folder,
          uploaded_by: user?.id || document.uploaded_by,
          version: '1.0'
        });

      if (error) throw error;

      toast({
        title: "Document Copied",
        description: "Document has been copied successfully"
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Copy Failed",
        description: error.message || "Failed to copy document",
        variant: "destructive"
      });
    }
  };

  const handleRenameDocument = async (documentId: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid document name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({ name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document Renamed",
        description: "Document has been renamed successfully"
      });

      fetchDocuments();
      setRenameDocumentId(null);
      setNewDocumentName('');
    } catch (error: any) {
      toast({
        title: "Rename Failed",
        description: error.message || "Failed to rename document",
        variant: "destructive"
      });
    }
  };

  const startRename = (documentId: string, currentName: string) => {
    setRenameDocumentId(documentId);
    setNewDocumentName(currentName);
  };

  const cancelRename = () => {
    setRenameDocumentId(null);
    setNewDocumentName('');
  };

  // Check if user can access document based on hierarchy
  const canAccessDocument = (document: any) => {
    if (isSuperAdmin) return true;
    if (document.uploaded_by === user?.id) return true;
    if (document.folder === 'personal' && document.uploaded_by !== user?.id) return false;
    if (document.is_hidden && document.uploaded_by !== user?.id) return false;
    return true;
  };

  // Check if user can delete a specific document
  const canDeleteDocument = (document: any) => {
    return canDeleteContent || user?.id === document.uploaded_by;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          e.preventDefault();
          // Copy functionality would be implemented here
        } else if (e.key === 'v') {
          e.preventDefault();
          // Paste functionality would be implemented here
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => canAccessDocument(doc))
    .filter(doc => {
      const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.file_size || 0;
          bValue = b.file_size || 0;
          break;
        case 'type':
          aValue = a.mime_type || '';
          bValue = b.mime_type || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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
    if (mimeType.includes('image')) return <FileText className="h-4 w-4 text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <FileText className="h-4 w-4 text-green-600" />;
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">
            Manage bureau documents and files • {filteredAndSortedDocuments.length} documents
          </p>
        </div>
        
        <div className="flex space-x-2">
          <CreateFolderDialog 
            onFolderCreated={handleFolderCreated}
            existingFolders={folders}
          />
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Upload Document</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Select any file to upload to the bureau document library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept="*/*"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!selectedFile}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'size' | 'type') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
          
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Move Document Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Document</DialogTitle>
            <DialogDescription>
              Select the folder to move this document to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder">Select Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMoveDocument} disabled={!selectedFolder}>
                Move
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Display */}
      {viewMode === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last modified</TableHead>
                <TableHead>File size</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDocuments.map((document) => (
                <ContextMenu key={document.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleImportant(document.id, document.is_important || false)}
                          className="h-6 w-6 p-0"
                        >
                          {document.is_important ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getFileIcon(document.mime_type)}
                          <div>
                            {renameDocumentId === document.id ? (
                              <Input
                                value={newDocumentName}
                                onChange={(e) => setNewDocumentName(e.target.value)}
                                onBlur={() => {
                                  if (newDocumentName.trim()) {
                                    handleRenameDocument(document.id, newDocumentName);
                                  } else {
                                    cancelRename();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (newDocumentName.trim()) {
                                      handleRenameDocument(document.id, newDocumentName);
                                    } else {
                                      cancelRename();
                                    }
                                  } else if (e.key === 'Escape') {
                                    cancelRename();
                                  }
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                            ) : (
                              <div className="font-medium">{document.name}</div>
                            )}
                            <div className="text-sm text-gray-500 capitalize">
                              {(document.folder || 'general')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">me</span>
                          </div>
                          <span className="text-sm">me</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(document.updated_at)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatFileSize(document.file_size)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDocument(document.id, document.name)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownloadDocument(document.id, document.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DocumentAnalytics 
                            documentId={document.id}
                            documentName={document.name}
                          />
                          {canDeleteDocument(document) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{document.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteDocument(document.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleViewDocument(document.id, document.name)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDownloadDocument(document.id, document.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => startRename(document.id, document.name)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleCopyDocument(document.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Document
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                      setDocumentToMove(document.id);
                      setMoveDialogOpen(true);
                    }}>
                      <Move className="h-4 w-4 mr-2" />
                      Move to Folder
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => toggleImportant(document.id, document.is_important || false)}>
                      {document.is_important ? (
                        <><StarOff className="h-4 w-4 mr-2" />Remove from Important</>
                      ) : (
                        <><Star className="h-4 w-4 mr-2" />Mark as Important</>
                      )}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    {canDeleteDocument(document) && (
                      <ContextMenuItem 
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredAndSortedDocuments.map((document) => (
            <ContextMenu key={document.id}>
              <ContextMenuTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(document.mime_type)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleImportant(document.id, document.is_important || false);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {document.is_important ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-medium line-clamp-2" title={document.name}>
                      {document.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      <div className="space-y-1">
                        <div className="capitalize">{document.folder || 'general'}</div>
                        <div>{formatDate(document.updated_at)}</div>
                        <div>{formatFileSize(document.file_size)}</div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(document.id, document.name);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(document.id, document.name);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <DocumentAnalytics 
                          documentId={document.id}
                          documentName={document.name}
                        />
                      </div>
                      {canDeleteDocument(document) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{document.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteDocument(document.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleViewDocument(document.id, document.name)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Document
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleDownloadDocument(document.id, document.name)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => startRename(document.id, document.name)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleCopyDocument(document.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Document
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  setDocumentToMove(document.id);
                  setMoveDialogOpen(true);
                }}>
                  <Move className="h-4 w-4 mr-2" />
                  Move to Folder
                </ContextMenuItem>
                <ContextMenuItem onClick={() => toggleImportant(document.id, document.is_important || false)}>
                  {document.is_important ? (
                    <><StarOff className="h-4 w-4 mr-2" />Remove from Important</>
                  ) : (
                    <><Star className="h-4 w-4 mr-2" />Mark as Important</>
                  )}
                </ContextMenuItem>
                <ContextMenuSeparator />
                {canDeleteDocument(document) && (
                  <ContextMenuItem 
                    onClick={() => handleDeleteDocument(document.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      {filteredAndSortedDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by uploading your first document'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
