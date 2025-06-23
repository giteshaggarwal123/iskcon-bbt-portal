
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
    console.log('Folder clicked:', folderId);
    setSelectedFolder(folderId);
  };

  // Generate breadcrumb path with error handling
  const getBreadcrumbPath = () => {
    if (!selectedFolder || !folders || folders.length === 0) return [];
    
    const path = [];
    let currentFolderId = selectedFolder;
    let depth = 0;
    const maxDepth = 10; // Prevent infinite loops
    
    while (currentFolderId && depth < maxDepth) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        path.unshift(folder);
        currentFolderId = folder.parent_folder_id;
      } else {
        console.warn('Folder not found:', currentFolderId);
        break;
      }
      depth++;
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

  // Enhanced download function with multiple strategies
  const handleDownloadDocument = async (document: any) => {
    try {
      console.log('Starting download for:', document.name, document.file_path);
      
      // Show loading toast
      const loadingToastId = toast({
        title: "Starting Download",
        description: `Preparing "${document.name}" for download...`
      });

      // Strategy 1: Direct download with fetch and blob
      try {
        const response = await fetch(document.file_path, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = document.name || 'download';
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
          
          toast({
            title: "Download Complete",
            description: `"${document.name}" downloaded successfully`
          });
          return;
        }
      } catch (fetchError) {
        console.warn('Fetch download failed, trying alternative method:', fetchError);
      }

      // Strategy 2: Direct link download
      try {
        const link = document.createElement('a');
        link.href = document.file_path;
        link.download = document.name || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: `"${document.name}" download initiated`
        });
        return;
      } catch (linkError) {
        console.warn('Link download failed, trying window.open:', linkError);
      }

      // Strategy 3: Open in new window as fallback
      try {
        const newWindow = window.open(document.file_path, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          toast({
            title: "File Opened",
            description: "File opened in new tab. Use your browser's download option."
          });
          return;
        }
      } catch (windowError) {
        console.warn('Window.open failed:', windowError);
      }

      // If all strategies fail
      throw new Error('All download methods failed');
      
    } catch (error) {
      console.error('Download error:', error);
      
      // Check if it's a demo/legacy file
      if (!document.file_path || 
          (!document.file_path.includes('supabase.co/storage') && 
           !document.file_path.includes('/storage/v1/object/public/'))) {
        toast({
          title: "Demo File",
          description: "This is a demo file. In production, files would be stored in Supabase Storage.",
          variant: "default"
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Unable to download the file. Please check your internet connection and try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Get unique uploaders for people filter with safety checks
  const uniqueUploaders = React.useMemo(() => {
    if (!documents || documents.length === 0) return [];
    return [...new Set(documents.map(doc => doc.uploaded_by).filter(Boolean))];
  }, [documents]);

  // Filter documents based on all filters with improved error handling
  const filteredDocuments = React.useMemo(() => {
    if (!documents || documents.length === 0) return [];
    
    return documents.filter(doc => {
      try {
        // Search filter with null checks
        const matchesSearch = !searchTerm || 
          (doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Type filter with null checks
        let matchesType = typeFilter === 'all';
        if (!matchesType && doc.mime_type) {
          const mimeType = doc.mime_type.toLowerCase();
          switch (typeFilter) {
            case 'pdf':
              matchesType = mimeType.includes('pdf');
              break;
            case 'word':
              matchesType = mimeType.includes('word') || 
                           mimeType.includes('document') || 
                           mimeType.includes('msword');
              break;
            case 'excel':
              matchesType = mimeType.includes('excel') || 
                           mimeType.includes('spreadsheet') || 
                           mimeType.includes('sheet');
              break;
            case 'image':
              matchesType = mimeType.includes('image');
              break;
            default:
              matchesType = true;
          }
        }
        
        // People filter with null checks
        const matchesPeople = peopleFilter === 'all' || doc.uploaded_by === peopleFilter;
        
        // Date filter with proper date parsing
        let matchesDate = dateFilter === 'all';
        if (!matchesDate && doc.created_at) {
          try {
            const docDate = new Date(doc.created_at);
            if (!isNaN(docDate.getTime())) {
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              
              switch (dateFilter) {
                case 'today':
                  matchesDate = docDate >= today;
                  break;
                case 'week':
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  matchesDate = docDate >= weekAgo;
                  break;
                case 'month':
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  matchesDate = docDate >= monthAgo;
                  break;
                default:
                  matchesDate = true;
              }
            }
          } catch (dateError) {
            console.warn('Date parsing error:', dateError);
            matchesDate = true; // Don't filter out if date is invalid
          }
        }
        
        return matchesSearch && matchesType && matchesPeople && matchesDate;
      } catch (error) {
        console.error('Filter error for document:', doc, error);
        return true; // Include document if filtering fails
      }
    });
  }, [documents, searchTerm, typeFilter, peopleFilter, dateFilter]);

  const currentFolder = folders?.find(f => f.id === selectedFolder);

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
            Manage and organize your documents • {filteredDocuments?.length || 0} documents
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
                folders={folders || []}
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
          userProfiles={userProfiles || {}}
          currentUserId={user?.id}
          onSearchChange={setSearchTerm}
          onTypeFilterChange={setTypeFilter}
          onPeopleFilterChange={setPeopleFilter}
          onDateFilterChange={setDateFilter}
        />

        {/* View Mode Toggle */}
        <div className="flex justify-end">
          <div className="flex border rounded-md overflow-hidden bg-background">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-none border-none h-9 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-none h-9 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Document Table/Grid */}
      <DocumentTable
        documents={filteredDocuments || []}
        folders={(folders || []).filter(f => f.parent_folder_id === selectedFolder)}
        userProfiles={userProfiles || {}}
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
            console.error('Upload error:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to upload document",
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
            console.error('Rename error:', error);
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
