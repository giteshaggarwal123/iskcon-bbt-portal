
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useDocumentOperations } from './useDocumentOperations';
import { useDocumentSearch } from './useDocumentSearch';
import { useDocumentFolders } from './useDocumentFolders';
import type { Document } from '@/types/document';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const { uploadDocument, moveDocument, deleteDocument } = useDocumentOperations();
  const { searchDocuments } = useDocumentSearch();
  const { createFolder, deleteFolder } = useDocumentFolders();

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const docs = data || [];
      setDocuments(docs);
      
      const uniqueFolders = Array.from(new Set(docs.map(doc => doc.folder).filter(Boolean)));
      setFolders(uniqueFolders);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleUploadDocument = useCallback(async (file: File, folder?: string) => {
    const result = await uploadDocument(file, folder);
    if (result) {
      fetchDocuments();
    }
    return result;
  }, [uploadDocument, fetchDocuments]);

  const handleMoveDocument = useCallback(async (documentId: string, newFolder: string) => {
    await moveDocument(documentId, newFolder);
    fetchDocuments();
  }, [moveDocument, fetchDocuments]);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    await deleteDocument(documentId);
    fetchDocuments();
  }, [deleteDocument, fetchDocuments]);

  const handleCreateFolder = useCallback(async (folderName: string) => {
    const result = await createFolder(folderName);
    if (result && !folders.includes(folderName)) {
      setFolders(prev => [...prev, folderName]);
    }
    return result;
  }, [createFolder, folders]);

  const handleDeleteFolder = useCallback(async (folderName: string) => {
    await deleteFolder(folderName);
    setFolders(prev => prev.filter(f => f !== folderName));
    await fetchDocuments();
  }, [deleteFolder, fetchDocuments]);

  const handleSearchDocuments = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchDocuments();
      return;
    }

    const results = await searchDocuments(searchTerm);
    setDocuments(results);
  }, [searchDocuments, fetchDocuments]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  return {
    documents,
    folders,
    loading,
    uploadDocument: handleUploadDocument,
    deleteDocument: handleDeleteDocument,
    deleteFolder: handleDeleteFolder,
    moveDocument: handleMoveDocument,
    createFolder: handleCreateFolder,
    searchDocuments: handleSearchDocuments,
    fetchDocuments
  };
};
