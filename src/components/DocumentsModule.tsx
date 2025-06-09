
import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Home } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

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
  const { isSuperAdmin, canDeleteContent } = useUserRole();
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

    return () => {
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(foldersChannel);
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

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
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
      toast({
        title: "Document Moved to Recycle Bin",
        description: `"${documentName}" has been moved to the recycle bin. You can restore it from Settings > Recycle Bin within 30 days.`
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

  // Filter folders for current level
  const filteredFolders = folders.filter(folder => {
    if (currentFolderId) {
      return folder.parent_folder_id === currentFolderId;
    } else {
      return folder.parent_folder_id === null;
    }
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
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header - Mobile optimized */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Document Repository</h1>
          <p className="text-sm lg:text-base text-gray-600">
            Manage and organize your documents • {filteredDocuments.length} documents
          </p>
        </div>
        
        {/* Action Buttons - Mobile optimized */}
        <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2">
          <CreateFolderDialog 
            onFolderCreated={createFolder}
            existingFolders={folders}
            currentFolderId={currentFolderId}
          />
          <DocumentUploadDialog onUpload={handleUpload} />
        </div>
      </div>

      {/* Breadcrumb Navigation - Mobile optimized */}
      {(currentFolderId || folderPath.length > 0) && (
        <div className="bg-gray-50 px-3 py-2 lg:px-4 lg:py-2 rounded-lg overflow-x-auto">
          <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-600 whitespace-nowrap">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleBreadcrumbClick(null)}
              className="flex items-center space-x-1 hover:bg-gray-200 px-2 py-1 rounded h-8 lg:h-auto"
            >
              <Home className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Home</span>
            </Button>
            
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleBreadcrumbClick(folder.id)}
                  className="hover:bg-gray-200 px-2 py-1 rounded h-8 lg:h-auto text-xs lg:text-sm"
                >
                  {folder.name}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Filters - Mobile optimized */}
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

      {/* Documents and Folders Table/List */}
      {filteredDocuments.length === 0 && filteredFolders.length === 0 ? (
        <div className="bg-white rounded-lg border">
          <div className="text-center py-12 px-4">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents or folders found</h3>
            <p className="text-sm lg:text-base text-gray-500 mb-6">
              {searchTerm || typeFilter !== 'all' || peopleFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by uploading your first document or creating a folder'}
            </p>
            {!searchTerm && (
              <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2 justify-center">
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
        />
      )}

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
  );
};
