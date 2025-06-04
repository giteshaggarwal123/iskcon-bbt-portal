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
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { FileText, Upload, Search, Filter, Download, Trash2, Eye, Plus, Folder, FolderOpen, Move, Edit, Copy, ArrowLeft, Home, Grid3X3, List, Star, StarOff, MoreHorizontal } from 'lucide-react';
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
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('general');
  const [draggedDocument, setDraggedDocument] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

    const targetFolder = uploadFolder;
    await uploadDocument(selectedFile, targetFolder);
    setSelectedFile(null);
    setUploadDialogOpen(false);
  };

  const handleViewDocument = (documentId: string) => {
    trackDocumentView(documentId);
    toast({
      title: "Document Opened",
      description: "Document view has been tracked"
    });
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      await deleteDocument(documentId);
      toast({
        title: "Document Deleted",
        description: `"${documentName}" has been permanently deleted`
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleFolderCreated = async (folderName: string) => {
    await createFolder(folderName);
    setUploadFolder(folderName);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    searchDocuments(term);
  };

  const handleMoveToFolder = (documentId: string, newFolder: string) => {
    moveDocument(documentId, newFolder);
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

  // Check if user can access document based on hierarchy
  const canAccessDocument = (document: any) => {
    if (isSuperAdmin) return true;
    if (document.uploaded_by === user?.id) return true;
    if (document.folder === 'personal') return document.uploaded_by === user?.id;
    return !document.is_hidden;
  };

  // Check if user can delete a specific document
  const canDeleteDocument = (document: any) => {
    return canDeleteContent || user?.id === document.uploaded_by;
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => canAccessDocument(doc))
    .filter(doc => {
      const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.mime_type?.includes(typeFilter);
      const matchesFolder = selectedFolder === 'all' || (doc.folder || 'general') === selectedFolder;
      
      return matchesSearch && matchesType && matchesFolder;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'modified':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'size':
          comparison = (a.file_size || 0) - (b.file_size || 0);
          break;
        default:
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
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

  // Create all folders list including default ones
  const allFolders = ['general', 'meetings', 'financial', 'policies', 'reports', 'personal', ...folders.filter(f => !['general', 'meetings', 'financial', 'policies', 'reports', 'personal'].includes(f))];

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
            existingFolders={allFolders}
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
                  Select a file to upload to the bureau document library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="folder">Folder</Label>
                  <Select value={uploadFolder} onValueChange={setUploadFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFolders.map(folder => (
                        <SelectItem key={folder} value={folder}>
                          {folder.charAt(0).toUpperCase() + folder.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex space-x-4 flex-1">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
              <SelectItem value="image">Images</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {allFolders.map(folder => (
                <SelectItem key={folder} value={folder}>
                  {folder.charAt(0).toUpperCase() + folder.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('card')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
                <TableHead className="w-16">Actions</TableHead>
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
                            <div className="font-medium">{document.name}</div>
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
                            onClick={() => handleViewDocument(document.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
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
                                    onClick={() => handleDeleteDocument(document.id, document.name)}
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
                    <ContextMenuItem onClick={() => handleViewDocument(document.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => toggleImportant(document.id, document.is_important || false)}>
                      {document.is_important ? (
                        <><StarOff className="h-4 w-4 mr-2" />Remove from Important</>
                      ) : (
                        <><Star className="h-4 w-4 mr-2" />Mark as Important</>
                      )}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleCopyDocument(document.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Document
                    </ContextMenuItem>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        <Move className="h-4 w-4 mr-2" />
                        Move to Folder
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        {allFolders.filter(f => f !== (document.folder || 'general')).map(folder => (
                          <ContextMenuItem 
                            key={folder}
                            onClick={() => handleMoveToFolder(document.id, folder)}
                          >
                            <Folder className="h-4 w-4 mr-2" />
                            {folder.charAt(0).toUpperCase() + folder.slice(1)}
                          </ContextMenuItem>
                        ))}
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    {canDeleteDocument(document) && (
                      <ContextMenuItem 
                        onClick={() => handleDeleteDocument(document.id, document.name)}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedDocuments.map((document) => (
            <ContextMenu key={document.id}>
              <ContextMenuTrigger>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getFileIcon(document.mime_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {document.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {(document.folder || 'general').charAt(0).toUpperCase() + (document.folder || 'general').slice(1)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleImportant(document.id, document.is_important || false)}
                          className="h-6 w-6 p-0"
                        >
                          {document.is_important ? (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                        <Badge variant="secondary" className="text-xs">
                          {document.mime_type?.split('/')[1] || 'file'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-gray-500">
                      <div>Size: {formatFileSize(document.file_size)}</div>
                      <div>Modified: {formatDate(document.updated_at)}</div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2"
                          onClick={() => handleViewDocument(document.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <Download className="h-3 w-3 mr-1" />
                          Download
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
                              variant="outline"
                              className="h-8 px-2 text-red-600 hover:bg-red-50"
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
                                onClick={() => handleDeleteDocument(document.id, document.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Document
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
                <ContextMenuItem onClick={() => handleViewDocument(document.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Document
                </ContextMenuItem>
                <ContextMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => toggleImportant(document.id, document.is_important || false)}>
                  {document.is_important ? (
                    <><StarOff className="h-4 w-4 mr-2" />Remove from Important</>
                  ) : (
                    <><Star className="h-4 w-4 mr-2" />Mark as Important</>
                  )}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleCopyDocument(document.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Document
                </ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <Move className="h-4 w-4 mr-2" />
                    Move to Folder
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {allFolders.filter(f => f !== (document.folder || 'general')).map(folder => (
                      <ContextMenuItem 
                        key={folder}
                        onClick={() => handleMoveToFolder(document.id, folder)}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {folder.charAt(0).toUpperCase() + folder.slice(1)}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                {canDeleteDocument(document) && (
                  <ContextMenuItem 
                    onClick={() => handleDeleteDocument(document.id, document.name)}
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
            {searchTerm ? 'Try adjusting your search or filter criteria' : 'Get started by uploading your first document'}
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
