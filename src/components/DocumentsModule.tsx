import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Home, Trash2, Lock, LayoutGrid, List } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { DocumentTable } from './documents/DocumentTable';
import { DocumentFilters } from './documents/DocumentFilters';
import { DocumentUploadDialog } from './documents/DocumentUploadDialog';
import { DocumentRenameDialog } from './documents/DocumentRenameDialog';
import { DocumentViewer } from './DocumentViewer';
import { CreateFolderDialog } from './CreateFolderDialog';
import { TrashFolder } from './documents/TrashFolder';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';

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

export const DocumentsModule: React.FC = () => {
  const { 
    documents, 
    folders, 
    loading, 
    uploadDocument, 
    deleteDocument, 
    createFolder,
    deleteFolder,
    moveDocument,
    fetchDocuments 
  } = useDocuments();
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin, canDeleteContent } = useUserRole();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [peopleFilter, setPeopleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: {first_name: string, last_name: string}}>({});
  const [activeTab, setActiveTab] = useState('documents');
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Auto-refresh setup with realtime subscriptions
  useEffect(() => {
    // Set up realtime subscription for documents table
    const documentsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('Documents table changed:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    // Set up realtime subscription for folders table
    const foldersChannel = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        (payload) => {
          console.log('Folders table changed:', payload);
        }
      )
      .subscribe();

    // Set up realtime subscription for recycle bin table
    const recycleBinChannel = supabase
      .channel('recycle-bin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recycle_bin'
        },
        (payload) => {
          console.log('Recycle bin table changed:', payload);
          // Refresh documents when items are moved to/from recycle bin
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(foldersChannel);
      supabase.removeChannel(recycleBinChannel);
    };
  }, [fetchDocuments]);

  // Fetch user profiles for displaying names
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (error) throw error;

        const profilesMap = data.reduce((acc, profile) => {
          acc[profile.id] = {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          };
          return acc;
        }, {});

        setUserProfiles(profilesMap);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    fetchUserProfiles();
  }, []);

  // Build folder path for breadcrumb navigation
  useEffect(() => {
    const buildFolderPath = () => {
      if (!currentFolderId) {
        setFolderPath([]);
        return;
      }

      const path: Folder[] = [];
      let folderId = currentFolderId;

      while (folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          path.unshift(folder);
          folderId = folder.parent_folder_id;
        } else {
          break;
        }
      }

      setFolderPath(path);
    };

    buildFolderPath();
  }, [currentFolderId, folders]);

  // Get unique uploaders for people filter
  const uniqueUploaders = [...new Set(documents.map(doc => doc.uploaded_by))];

  const handleUpload = async (file: File, folderId?: string) => {
    await uploadDocument(file, folderId || currentFolderId || undefined);
  };

  // Check if user can access locked folders
  const canAccessLockedFolders = isSuperAdmin || isAdmin;

  const handleFolderClick = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    
    // Check if trying to access a locked folder
    if (folder?.is_locked && !canAccessLockedFolders) {
      toast({
        title: "Access Denied",
        description: "This folder is locked and only accessible to administrators",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    if (folderId) {
      const folder = folders.find(f => f.id === folderId);
      
      // Check if trying to access a locked folder
      if (folder?.is_locked && !canAccessLockedFolders) {
        toast({
          title: "Access Denied",
          description: "This folder is locked and only accessible to administrators",
          variant: "destructive"
        });
        return;
      }
    }
    
    setCurrentFolderId(folderId);
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
          folder_id: currentFolderId,
          folder: currentFolderId ? null : document.folder,
          uploaded_by: user?.id || document.uploaded_by,
        });

      if (error) throw error;

      toast({
        title: "Document Copied",
        description: "Document has been copied to current folder"
      });
    } catch (error: any) {
      toast({
        title: "Copy Failed",
        description: error.message || "Failed to copy document",
        variant: "destructive"
      });
    }
  };

  const handleMoveDocument = async (documentId: string, targetFolderId: string | null) => {
    await moveDocument(documentId, targetFolderId);
  };

  const handleToggleImportant = async (documentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_important: !currentStatus })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document Updated",
        description: `Document ${!currentStatus ? 'marked as important' : 'unmarked as important'}`
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update document",
        variant: "destructive"
      });
    }
  };

  const handleRename = async (newName: string) => {
    if (!selectedDocument || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      toast({
        title: "Document Renamed",
        description: "Document has been renamed successfully"
      });

      setRenameDialogOpen(false);
      setSelectedDocument(null);
    } catch (error: any) {
      toast({
        title: "Rename Failed",
        description: error.message || "Failed to rename document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      await deleteDocument(documentId);
      
      // Force refresh the documents list to ensure the deleted document disappears
      await fetchDocuments();
      
      toast({
        title: "Document Moved to Recycle Bin",
        description: `"${documentName}" has been moved to the recycle bin. You can restore it from the Trash within 15 days.`
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to move document to recycle bin",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
    trackDocumentView(document.id);
  };

  const handleDownloadDocument = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.file_path;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading "${document.name}"`
    });
  };

  const trackDocumentView = async (documentId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('document_views')
        .insert({
          document_id: documentId,
          user_id: user.id,
          view_started_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking document view:', error);
    }
  };

  // Filter documents and folders based on current folder and other filters
  const filteredDocuments = documents.filter(doc => {
    // Folder filter - show documents in current folder
    if (currentFolderId) {
      if (doc.folder_id !== currentFolderId) return false;
    } else {
      // Show documents with no folder_id (root level)
      if (doc.folder_id !== null) return false;
    }

    // Access control
    if (!isSuperAdmin) {
      if (doc.is_hidden && doc.uploaded_by !== user?.id) {
        return false;
      }
      if (doc.folder === 'personal' && doc.uploaded_by !== user?.id) {
        return false;
      }
    }

    // Search filter
    const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'pdf' && doc.mime_type?.includes('pdf')) ||
      (typeFilter === 'word' && (doc.mime_type?.includes('word') || doc.mime_type?.includes('document'))) ||
      (typeFilter === 'excel' && (doc.mime_type?.includes('sheet') || doc.mime_type?.includes('excel'))) ||
      (typeFilter === 'image' && doc.mime_type?.includes('image'));
    
    // People filter
    const matchesPeople = peopleFilter === 'all' || doc.uploaded_by === peopleFilter;
    
    // Date filter
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && new Date(doc.created_at).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && new Date(doc.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && new Date(doc.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesType && matchesPeople && matchesDate;
  });

  // Filter folders for current level and access control
  const filteredFolders = folders.filter(folder => {
    // Check parent folder matching
    if (currentFolderId) {
      if (folder.parent_folder_id !== currentFolderId) return false;
    } else {
      if (folder.parent_folder_id !== null) return false;
    }

    // Hide locked folders from non-admin users
    if (folder.is_locked && !canAccessLockedFolders) {
      return false;
    }

    return true;
  });

  // Check if user can delete a specific document
  const canDeleteDocument = (document: Document) => {
    return canDeleteContent || user?.id === document.uploaded_by;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6">
        <div className="space-y-3 sm:space-y-6 w-full">
          {/* Header - Mobile Optimized */}
          <div className="space-y-3 sm:space-y-4 w-full">
            <div className="text-center sm:text-left px-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">Document Repository</h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Manage and organize your documents • {filteredDocuments.length} documents
                {currentFolderId && folders.find(f => f.id === currentFolderId)?.is_locked && (
                  <span className="inline-flex items-center ml-2 text-red-600">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    LOCKED FOLDER
                  </span>
                )}
              </p>
            </div>
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 w-full px-1">
              <Dialog open={trashDialogOpen} onOpenChange={setTrashDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center text-xs sm:text-sm">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span>Trash</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[80vh] overflow-auto mx-2">
                  <DialogHeader>
                    <DialogTitle>Trash</DialogTitle>
                  </DialogHeader>
                  <TrashFolder />
                </DialogContent>
              </Dialog>
              <CreateFolderDialog 
                onFolderCreated={createFolder}
                existingFolders={folders}
                currentFolderId={currentFolderId}
              />
              <DocumentUploadDialog onUpload={handleUpload} />
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 sm:ml-auto">
                <Toggle
                  pressed={viewMode === 'card'}
                  onPressedChange={() => setViewMode('card')}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                </Toggle>
                <Toggle
                  pressed={viewMode === 'list'}
                  onPressedChange={() => setViewMode('list')}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4" />
                </Toggle>
              </div>
            </div>
          </div>

          {/* Breadcrumb Navigation - Mobile Optimized */}
          {(currentFolderId || folderPath.length > 0) && (
            <div className="w-full px-1">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 sm:px-3 py-2 rounded-lg overflow-x-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleBreadcrumbClick(null)}
                  className="flex items-center space-x-1 hover:bg-muted px-1 sm:px-2 py-1 rounded whitespace-nowrap flex-shrink-0 text-xs sm:text-sm"
                >
                  <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Home</span>
                </Button>
                
                {folderPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-muted-foreground/60" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleBreadcrumbClick(folder.id)}
                      className="hover:bg-muted px-1 sm:px-2 py-1 rounded whitespace-nowrap flex-shrink-0 flex items-center space-x-1 text-xs sm:text-sm"
                    >
                      {folder.is_locked && <Lock className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />}
                      <span className={folder.is_locked ? 'text-red-600' : ''}>
                        {folder.name}
                      </span>
                    </Button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Filters - Mobile Optimized */}
          <div className="w-full px-1">
            <DocumentFilters
              searchTerm={searchTerm}
              typeFilter={typeFilter}
              peopleFilter={peopleFilter}
              dateFilter={dateFilter}
              uniqueUploaders={uniqueUploaders}
              userProfiles={userProfiles}
              currentUserId={user?.id}
              onSearchChange={setSearchTerm}
              onTypeFilterChange={setTypeFilter}
              onPeopleFilterChange={setPeopleFilter}
              onDateFilterChange={setDateFilter}
            />
          </div>

          {/* Documents and Folders Content - Mobile Optimized */}
          <div className="w-full px-1">
            {filteredDocuments.length === 0 && filteredFolders.length === 0 ? (
              <div className="bg-card rounded-lg border w-full">
                <div className="text-center py-6 sm:py-8 lg:py-12 px-3 sm:px-4">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-medium text-foreground mb-2">No documents or folders found</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                    {searchTerm || typeFilter !== 'all' || peopleFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by uploading your first document or creating a folder'}
                  </p>
                  {!searchTerm && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center max-w-sm mx-auto">
                      <CreateFolderDialog 
                        onFolderCreated={createFolder}
                        existingFolders={folders}
                        currentFolderId={currentFolderId}
                      />
                      <DocumentUploadDialog onUpload={handleUpload} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <DocumentTable
                documents={filteredDocuments}
                folders={filteredFolders}
                userProfiles={userProfiles}
                currentUserId={user?.id}
                canDeleteDocument={canDeleteDocument}
                onViewDocument={handleViewDocument}
                onDownloadDocument={handleDownloadDocument}
                onToggleImportant={handleToggleImportant}
                onRenameDocument={(document) => {
                  setSelectedDocument(document);
                  setRenameDialogOpen(true);
                }}
                onCopyDocument={handleCopyDocument}
                onDeleteDocument={handleDeleteDocument}
                onDeleteFolder={deleteFolder}
                onFolderClick={handleFolderClick}
                onMoveDocument={handleMoveDocument}
                currentFolderId={currentFolderId}
                canAccessLockedFolders={canAccessLockedFolders}
                viewMode={viewMode}
              />
            )}
          </div>

          {/* Rename Dialog */}
          <DocumentRenameDialog
            isOpen={renameDialogOpen}
            document={selectedDocument}
            onClose={() => {
              setRenameDialogOpen(false);
              setSelectedDocument(null);
            }}
            onRename={handleRename}
          />

          {/* Document Viewer */}
          <DocumentViewer
            isOpen={viewerOpen}
            document={selectedDocument}
            onClose={() => {
              setViewerOpen(false);
              setSelectedDocument(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsModule;
