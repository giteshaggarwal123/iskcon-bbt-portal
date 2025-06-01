
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { FileText, Upload, Search, Filter, Download, Trash2, Eye, Plus, Folder, FolderOpen, Move, Edit, Copy, ArrowLeft, Home } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DocumentAnalytics } from './DocumentAnalytics';
import { CreateFolderDialog } from './CreateFolderDialog';
import { supabase } from '@/integrations/supabase/client';

export const DocumentsModule: React.FC = () => {
  const { documents, folders, loading, uploadDocument, deleteDocument, moveDocument, createFolder, searchDocuments, fetchDocuments } = useDocuments();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('general');
  const [draggedDocument, setDraggedDocument] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

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

    const targetFolder = currentFolder || uploadFolder;
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

  const handleFolderCreated = async (folderName: string) => {
    await createFolder(folderName);
    setUploadFolder(folderName);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setCurrentFolder(null);
      setSelectedFolder('all');
    }
    searchDocuments(term);
  };

  const handleDragStart = (e: React.DragEvent, documentId: string) => {
    setDraggedDocument(documentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    if (draggedDocument) {
      moveDocument(draggedDocument, targetFolder);
      setDraggedDocument(null);
    }
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

  const handleDeleteFolder = async (folderName: string) => {
    const folderDocuments = documents.filter(doc => (doc.folder || 'general') === folderName);
    
    if (folderDocuments.length > 0) {
      toast({
        title: "Cannot Delete Folder",
        description: "Please move or delete all documents in this folder first",
        variant: "destructive"
      });
      return;
    }

    // Since folders are virtual, we just need to refresh the view
    toast({
      title: "Folder Deleted",
      description: "Folder has been removed"
    });
    
    if (currentFolder === folderName) {
      setCurrentFolder(null);
    }
    fetchDocuments();
  };

  const openFolder = (folderName: string) => {
    setCurrentFolder(folderName);
    setSelectedFolder(folderName);
    setSearchTerm('');
  };

  const goBackToRoot = () => {
    setCurrentFolder(null);
    setSelectedFolder('all');
  };

  // Fixed filtering logic to properly separate documents by folder
  const filteredDocuments = documents.filter(doc => {
    const documentFolder = doc.folder || 'general';
    const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (currentFolder) {
      // When viewing a specific folder, ONLY show documents in that exact folder
      return matchesSearch && documentFolder === currentFolder;
    } else {
      // When in main view (not viewing a specific folder)
      if (selectedFolder === 'all') {
        // Show only documents in 'general' folder when showing "all"
        return matchesSearch && documentFolder === 'general';
      } else {
        // When filtering by dropdown, show documents in that specific folder
        return matchesSearch && documentFolder === selectedFolder;
      }
    }
  });

  // Define documents not in folders for when not viewing a specific folder
  const documentsNotInFolders = currentFolder ? [] : filteredDocuments;

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

  // Create all folders list including default ones
  const allFolders = ['general', 'meetings', 'financial', 'policies', 'reports', ...folders.filter(f => !['general', 'meetings', 'financial', 'policies', 'reports'].includes(f))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Better Navigation */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            {currentFolder && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={goBackToRoot}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to All Documents</span>
              </Button>
            )}
          </div>
          
          {/* Enhanced Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={goBackToRoot}
                  className="flex items-center space-x-1 cursor-pointer hover:text-primary"
                >
                  <Home className="h-4 w-4" />
                  <span>General Documents</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentFolder && currentFolder !== 'general' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize font-medium">
                      {currentFolder}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          
          <p className="text-gray-600">
            {currentFolder 
              ? `Viewing ${currentFolder === 'general' ? 'general documents' : `${currentFolder} folder`} • ${filteredDocuments.length} documents`
              : `Manage bureau documents and files • ${documents.filter(d => (d.folder || 'general') === 'general').length} general documents`
            }
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
                  <Select value={currentFolder || uploadFolder} onValueChange={setUploadFolder}>
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

      {/* Search and Filter - only show when not in a specific folder */}
      {!currentFolder && (
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">General Documents</SelectItem>
              {allFolders.filter(f => f !== 'general').map(folder => (
                <SelectItem key={folder} value={folder}>
                  {folder.charAt(0).toUpperCase() + folder.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Folders Row - only show when not in a specific folder */}
      {!currentFolder && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Folder className="h-5 w-5" />
            <span>Folders</span>
          </h2>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {allFolders.filter(f => f !== 'general').map((folder) => (
              <ContextMenu key={folder}>
                <ContextMenuTrigger>
                  <div
                    className="flex-shrink-0 min-w-[120px] p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, folder)}
                    onClick={() => openFolder(folder)}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors">
                        <Folder className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {folder.charAt(0).toUpperCase() + folder.slice(1)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {documents.filter(doc => (doc.folder || 'general') === folder).length} files
                      </p>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => openFolder(folder)}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open Folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    onClick={() => handleDeleteFolder(folder)}
                    className="text-red-600"
                    disabled={['general', 'meetings', 'financial', 'policies', 'reports'].includes(folder)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Folder
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="space-y-3">
        {currentFolder && (
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents in {currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1)}</span>
          </h2>
        )}
        
        {/* Documents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <ContextMenu key={document.id}>
              <ContextMenuTrigger>
                <Card 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  draggable
                  onDragStart={(e) => handleDragStart(e, document.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
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
                      <Badge variant="secondary" className="text-xs">
                        {document.mime_type?.split('/')[1] || 'file'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-gray-500">
                      <div>Size: {formatFileSize(document.file_size)}</div>
                      <div>Uploaded: {formatDate(document.created_at)}</div>
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
                      {user?.id === document.uploaded_by && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-red-600 hover:bg-red-50"
                          onClick={() => deleteDocument(document.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
                {user?.id === document.uploaded_by && (
                  <ContextMenuItem 
                    onClick={() => deleteDocument(document.id)}
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

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || (currentFolder && selectedFolder !== 'all')
                ? 'Try adjusting your search or filter criteria'
                : currentFolder 
                  ? `No documents in ${currentFolder} folder yet`
                  : 'Get started by uploading your first document'}
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
    </div>
  );
};
