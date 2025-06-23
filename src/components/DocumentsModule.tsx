
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { DocumentUploadDialog } from './documents/DocumentUploadDialog';
import { DocumentRenameDialog } from './documents/DocumentRenameDialog';
import { DocumentTable } from './documents/DocumentTable';
import { DocumentFilters } from './documents/DocumentFilters';
import { FolderManager } from './documents/FolderManager';
import { TrashFolder } from './documents/TrashFolder';
import { DocumentViewer } from './DocumentViewer';
import { Search, Upload, Trash2, Grid, List, Plus, Home } from 'lucide-react';

export const DocumentsModule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [peopleFilter, setPeopleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
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

  // Generate breadcrumb path
  const getBreadcrumbPath = () => {
    if (!selectedFolder) return [];
    
    const path = [];
    let currentFolderId = selectedFolder;
    
    while (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        path.unshift(folder);
        currentFolderId = folder.parent_folder_id;
      } else {
        break;
      }
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

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

  // Get unique uploaders for people filter
  const uniqueUploaders = [...new Set(documents.map(doc => doc.uploaded_by))];

  // Filter documents based on all filters
  const filteredDocuments = documents.filter(doc => {
    console.log('Filtering document:', doc.name);
    console.log('Search term:', searchTerm);
    console.log('Type filter:', typeFilter);
    console.log('People filter:', peopleFilter);
    console.log('Date filter:', dateFilter);
    
    // Search filter
    const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    console.log('Matches search:', matchesSearch);
    
    // Type filter
    let matchesType = typeFilter === 'all';
    if (!matchesType && doc.mime_type) {
      const mimeType = doc.mime_type.toLowerCase();
      switch (typeFilter) {
        case 'pdf':
          matchesType = mimeType.includes('pdf');
          break;
        case 'word':
          matchesType = mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('msword');
          break;
        case 'excel':
          matchesType = mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('sheet');
          break;
        case 'image':
          matchesType = mimeType.includes('image');
          break;
        default:
          matchesType = true;
      }
    }
    console.log('Matches type:', matchesType);
    
    // People filter
    const matchesPeople = peopleFilter === 'all' || doc.uploaded_by === peopleFilter;
    console.log('Matches people:', matchesPeople);
    
    // Date filter
    let matchesDate = dateFilter === 'all';
    if (!matchesDate) {
      const docDate = new Date(doc.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = docDate >= today;
          break;
        case 'week':
          matchesDate = docDate >= weekAgo;
          break;
        case 'month':
          matchesDate = docDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }
    }
    console.log('Matches date:', matchesDate);
    
    const finalMatch = matchesSearch && matchesType && matchesPeople && matchesDate;
    console.log('Final match:', finalMatch);
    return finalMatch;
  });

  console.log('Total documents:', documents.length);
  console.log('Filtered documents:', filteredDocuments.length);

  const currentFolder = folders.find(f => f.id === selectedFolder);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'px-3 py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-4`}>
      {/* Header Section */}
      <div className={`${isMobile ? 'space-y-3' : 'flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>Document Repository</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'mt-1'}`}>
            Manage and organize your documents • {filteredDocuments.length} documents
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className={`${isMobile ? 'grid grid-cols-1 gap-2 w-full' : 'flex flex-wrap items-center gap-2'}`}>
          <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex gap-2'}`}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTrashOpen(true)}
              className={`${isMobile ? 'text-xs' : ''} flex items-center justify-center gap-2`}
            >
              <Trash2 className="h-4 w-4" />
              {isMobile ? 'Trash' : 'Trash'}
            </Button>
            
            <div className={isMobile ? 'w-full' : ''}>
              <FolderManager 
                folders={folders}
                onCreateFolder={createFolder}
                onDeleteFolder={handleDeleteFolder}
                currentFolderId={selectedFolder}
                userCanAccessLocked={true}
                showCreateButton={true}
              />
            </div>
          </div>
          
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            size="sm"
            className={`${isMobile ? 'w-full' : ''} bg-[#8E1616] hover:bg-[#7A1414] text-white flex items-center justify-center gap-2`}
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className={`bg-muted/50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => setSelectedFolder(null)}
                className="cursor-pointer flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                {isMobile ? '' : 'Home'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbPath.length - 1 ? (
                    <BreadcrumbPage className={isMobile ? 'text-sm' : ''}>{folder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`cursor-pointer ${isMobile ? 'text-sm' : ''}`}
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Document Filters */}
      <div className="space-y-4">
        <DocumentFilters
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          peopleFilter={peopleFilter}
          dateFilter={dateFilter}
          uniqueUploaders={uniqueUploaders}
          userProfiles={userProfiles}
          currentUserId={user?.id}
          onSearchChange={(value) => {
            console.log('Search changed to:', value);
            setSearchTerm(value);
          }}
          onTypeFilterChange={(value) => {
            console.log('Type filter changed to:', value);
            setTypeFilter(value);
          }}
          onPeopleFilterChange={(value) => {
            console.log('People filter changed to:', value);
            setPeopleFilter(value);
          }}
          onDateFilterChange={(value) => {
            console.log('Date filter changed to:', value);
            setDateFilter(value);
          }}
        />

        {/* View Mode Toggle */}
        <div className="flex justify-end">
          <div className="flex border rounded-md overflow-hidden bg-background">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                console.log('Switching to card view');
                setViewMode('card');
              }}
              className="rounded-none border-none h-9 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                console.log('Switching to list view');
                setViewMode('list');
              }}
              className="rounded-none border-none h-9 px-3"
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
