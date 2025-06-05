
import React, { useState, useEffect } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentTable } from './documents/DocumentTable';
import { DocumentFilters } from './documents/DocumentFilters';
import { DocumentUploadDialog } from './documents/DocumentUploadDialog';
import { DocumentRenameDialog } from './documents/DocumentRenameDialog';

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

export const DocumentsModule: React.FC = () => {
  const { documents, loading, uploadDocument, deleteDocument, fetchDocuments } = useDocuments();
  const { user } = useAuth();
  const { isSuperAdmin, canDeleteContent } = useUserRole();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [peopleFilter, setPeopleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
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

    // Set up realtime subscription for recycle_bin table
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
          console.log('Recycle bin changed:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(documentsChannel);
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

  // Get unique uploaders for people filter
  const uniqueUploaders = [...new Set(documents.map(doc => doc.uploaded_by))];

  const handleUpload = async (file: File) => {
    // Upload to 'general' folder by default, or 'personal' if it's a member
    const folder = isSuperAdmin ? 'general' : 'personal';
    await uploadDocument(file, folder);
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

      // No need to manually refresh - realtime will handle it
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
      // No need to manually refresh - realtime will handle it
    } catch (error: any) {
      toast({
        title: "Rename Failed",
        description: error.message || "Failed to rename document",
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
        });

      if (error) throw error;

      toast({
        title: "Document Copied",
        description: "Document has been copied successfully"
      });

      // No need to manually refresh - realtime will handle it
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
      // No need to manually refresh - realtime will handle it
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to move document to recycle bin",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    // Create a download URL for the document
    const downloadUrl = `${document.file_path}`;
    window.open(downloadUrl, '_blank');
    
    // Track the view in analytics
    trackDocumentView(document.id);
  };

  const handleDownloadDocument = (document: Document) => {
    // Create a download link and trigger download
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

  // Filter documents based on access control and filters
  const filteredDocuments = documents.filter(doc => {
    // Access control
    if (!isSuperAdmin) {
      // Members can only see non-hidden documents and their own documents
      if (doc.is_hidden && doc.uploaded_by !== user?.id) {
        return false;
      }
      // Members can't see other people's personal folders
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Document Repository</h1>
          <p className="text-gray-600">
            Manage and organize your documents • {filteredDocuments.length} documents
          </p>
        </div>
        
        <div className="flex space-x-2">
          <DocumentUploadDialog onUpload={handleUpload} />
        </div>
      </div>

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

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg border">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter !== 'all' || peopleFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by uploading your first document'}
            </p>
            {!searchTerm && (
              <DocumentUploadDialog onUpload={handleUpload} />
            )}
          </div>
        </div>
      ) : (
        <DocumentTable
          documents={filteredDocuments}
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
    </div>
  );
};
