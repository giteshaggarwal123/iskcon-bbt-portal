import React, { useState, useEffect } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useFolders } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentFilters } from './documents/DocumentFilters';
import { DocumentRenameDialog } from './documents/DocumentRenameDialog';
import { FolderManagement } from './folders/FolderManagement';
import { DocumentHeader } from './documents/DocumentHeader';
import { DocumentContent } from './documents/DocumentContent';
import { useDocumentManager } from './documents/DocumentManager';

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

export const DocumentsModule: React.FC = () => {
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments();
  const { folders } = useFolders();
  const { user } = useAuth();
  const { isSuperAdmin, canDeleteContent } = useUserRole();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [peopleFilter, setPeopleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: {first_name: string, last_name: string}}>({});

  const {
    renameDialogOpen,
    setRenameDialogOpen,
    selectedDocument,
    setSelectedDocument,
    handleRename
  } = useDocumentManager({ user });

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

  // Get unique uploaders for people filter
  const uniqueUploaders = [...new Set(documents.map(doc => doc.uploaded_by))];

  const handleUpload = async (file: File) => {
    await uploadDocument(file, selectedFolderId);
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
          folder_id: document.folder_id,
          folder: document.folder,
          uploaded_by: user?.id || document.uploaded_by,
        });

      if (error) throw error;

      toast({
        title: "Document Copied",
        description: "Document has been copied successfully"
      });
    } catch (error: any) {
      toast({
        title: "Copy Failed",
        description: error.message || "Failed to copy document",
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
    const downloadUrl = `${document.file_path}`;
    window.open(downloadUrl, '_blank');
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

  // Filter documents based on access control, folder selection, and filters
  const filteredDocuments = documents.filter(doc => {
    // Access control
    if (!isSuperAdmin) {
      if (doc.is_hidden && doc.uploaded_by !== user?.id) {
        return false;
      }
      if (doc.folder === 'personal' && doc.uploaded_by !== user?.id) {
        return false;
      }
    }

    // Folder filter
    if (selectedFolderId === null) {
      // Show documents in "general" folder or without folder assignment
      if (doc.folder_id !== null && doc.folder !== 'general') {
        return false;
      }
    } else {
      // Show documents in selected folder
      if (doc.folder_id !== selectedFolderId) {
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

  // Check if user can delete a specific document
  const canDeleteDocument = (document: Document) => {
    return canDeleteContent || user?.id === document.uploaded_by;
  };

  // Get current folder name for display
  const getCurrentFolderName = () => {
    if (selectedFolderId === null) return 'General';
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder?.name || 'Unknown Folder';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar for folder management */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <FolderManagement 
          onFolderSelect={setSelectedFolderId}
          selectedFolderId={selectedFolderId}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <DocumentHeader 
          currentFolderName={getCurrentFolderName()}
          documentCount={filteredDocuments.length}
          onUpload={handleUpload}
        />

        {/* Filters */}
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

        {/* Documents Content */}
        <DocumentContent
          filteredDocuments={filteredDocuments}
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
          onUpload={handleUpload}
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          peopleFilter={peopleFilter}
          dateFilter={dateFilter}
          getCurrentFolderName={getCurrentFolderName}
        />

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
      </div>
    </div>
  );
};
