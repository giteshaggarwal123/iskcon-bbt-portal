import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUploadDialog } from './documents/DocumentUploadDialog';
import { DocumentRenameDialog } from './documents/DocumentRenameDialog';
import { DocumentTable } from './documents/DocumentTable';
import { FolderManager } from './documents/FolderManager';
import { TrashFolder } from './documents/TrashFolder';
import { DocumentViewer } from './DocumentViewer';
import { Search, Upload, Trash2, Grid, List, Plus } from 'lucide-react';

export const DocumentsModule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [renameDocument, setRenameDocument] = useState<any>(null);
  const [viewDocument, setViewDocument] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

  const {
    documents,
    folders,
    userProfiles,
    loading,
    uploadDocument,
    createFolder,
    deleteDocument,
    deleteFolder,
    renameDocumentMutation,
    copyDocument,
    toggleImportant,
    moveDocument,
    refreshDocuments
  } = useDocuments(selectedFolder);

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  const handleDeleteFolder = async (folderId: string): Promise<boolean> => {
    try {
      await deleteFolder.mutateAsync(folderId);
      toast({
        title: "Success",
        description: "Folder deleted successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleRenameDocument = (document: any) => {
    setRenameDocument(document);
  };

  const handleRenameSubmit = async (documentId: string, newName: string) => {
    try {
      await renameDocumentMutation.mutateAsync({ documentId, newName });
      setRenameDocument(null);
      toast({
        title: "Success",
        description: "Document renamed successfully"
      });
    } catch (error: any) {
      console.error('Error renaming document:', error);
      toast({
        title: "Error",
        description: "Failed to rename document",
        variant: "destructive"
      });
    }
  };

  const handleCopyDocument = async (documentId: string) => {
    try {
      await copyDocument.mutateAsync(documentId);
      toast({
        title: "Success",
        description: "Document copied successfully"
      });
    } catch (error: any) {
      console.error('Error copying document:', error);
      toast({
        title: "Error",
        description: "Failed to copy document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      await deleteDocument.mutateAsync(documentId);
      toast({
        title: "Success",
        description: `"${documentName}" moved to trash`
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleToggleImportant = async (documentId: string, currentStatus: boolean) => {
    try {
      await toggleImportant.mutateAsync({ documentId, isImportant: !currentStatus });
      toast({
        title: "Success",
        description: `Document ${!currentStatus ? 'marked as important' : 'unmarked as important'}`
      });
    } catch (error: any) {
      console.error('Error toggling important status:', error);
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive"
      });
    }
  };

  const handleMoveDocument = async (documentId: string, targetFolderId: string | null) => {
    try {
      await moveDocument.mutateAsync({ documentId, targetFolderId });
      toast({
        title: "Success",
        description: "Document moved successfully"
      });
    } catch (error: any) {
      console.error('Error moving document:', error);
      toast({
        title: "Error",
        description: "Failed to move document",
        variant: "destructive"
      });
    }
  };

  const canDeleteDocument = (document: any) => {
    return user?.id === document.uploaded_by;
  };

  const handleViewDocument = (document: any) => {
    setViewDocument(document);
  };

  const handleDownloadDocument = (document: any) => {
    const link = document.createElement('a');
    link.href = document.file_path;
    link.download = document.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading "${document.name}"`
    });
  };

  // Filter documents based on search term and filter type
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'important' && doc.is_important) ||
      (filterType === 'recent' && new Date(doc.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return matchesSearch && matchesType;
  });

  const currentFolder = folders.find(f => f.id === selectedFolder);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Repository</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your documents • {filteredDocuments.length} documents
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTrashOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Trash
          </Button>
          
          <FolderManager 
            folders={folders}
            onCreateFolder={createFolder}
            onDeleteFolder={handleDeleteFolder}
            currentFolderId={selectedFolder}
            userCanAccessLocked={true}
            showCreateButton={true}
          />
          
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
            </SelectContent>
          </Select>

          <Select value="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All People" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
            </SelectContent>
          </Select>

          <Select value="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-none border-none h-8 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-none h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Document Table/Grid */}
      <DocumentTable
        documents={filteredDocuments}
        folders={folders.filter(f => f.parent_folder_id === selectedFolder)}
        userProfiles={userProfiles}
        currentUserId={user?.id}
        canDeleteDocument={canDeleteDocument}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onToggleImportant={handleToggleImportant}
        onRenameDocument={handleRenameDocument}
        onCopyDocument={handleCopyDocument}
        onDeleteDocument={handleDeleteDocument}
        onDeleteFolder={handleDeleteFolder}
        onFolderClick={handleFolderClick}
        onMoveDocument={handleMoveDocument}
        currentFolderId={selectedFolder}
        canAccessLockedFolders={true}
        viewMode={viewMode}
      />

      {/* Dialogs */}
      <DocumentUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={async (file, folder) => {
          try {
            await uploadDocument(file, folder || selectedFolder || undefined);
            setIsUploadDialogOpen(false);
            toast({
              title: "Success",
              description: `Document "${file.name}" uploaded successfully`
            });
          } catch (error: any) {
            toast({
              title: "Error",
              description: "Failed to upload document",
              variant: "destructive"
            });
          }
        }}
        currentFolderId={selectedFolder}
      />

      <DocumentRenameDialog
        isOpen={!!renameDocument}
        document={renameDocument}
        onClose={() => setRenameDocument(null)}
        onRename={async (newName) => {
          try {
            await renameDocumentMutation.mutateAsync({ documentId: renameDocument?.id, newName });
            setRenameDocument(null);
            toast({
              title: "Success",
              description: "Document renamed successfully"
            });
          } catch (error: any) {
            toast({
              title: "Error",
              description: "Failed to rename document",
              variant: "destructive"
            });
          }
        }}
      />

      <TrashFolder
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />

      <DocumentViewer
        isOpen={!!viewDocument}
        onClose={() => setViewDocument(null)}
        document={viewDocument}
        documentType="document"
      />
    </div>
  );
};
