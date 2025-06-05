
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
  is_sharepoint_file: boolean;
  sharepoint_id: string | null;
  sharepoint_url: string | null;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const docs = data || [];
      setDocuments(docs);
      
      // Extract unique folders efficiently
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

  const createFolder = useCallback(async (folderName: string) => {
    try {
      // Update folders list immediately for better UX
      if (!folders.includes(folderName)) {
        setFolders(prev => [...prev, folderName]);
      }

      toast({
        title: "Success",
        description: `Folder "${folderName}" created successfully`
      });

      return folderName;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
      throw error;
    }
  }, [folders, toast]);

  const deleteFolder = useCallback(async (folderName: string) => {
    try {
      // Delete all documents in the folder from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('folder', folderName);

      if (error) throw error;

      // Update folders list
      setFolders(prev => prev.filter(f => f !== folderName));

      toast({
        title: "Success",
        description: `Folder "${folderName}" and all its contents deleted successfully`
      });

      // Refresh documents
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  }, [fetchDocuments, toast]);

  const uploadDocument = useCallback(async (file: File, folder: string = 'Documents') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload documents",
        variant: "destructive"
      });
      return;
    }

    try {
      const document = {
        name: file.name,
        file_path: URL.createObjectURL(file),
        file_size: file.size,
        mime_type: file.type,
        folder: folder,
        uploaded_by: user.id,
        is_sharepoint_file: false,
        sharepoint_id: null,
        sharepoint_url: null,
        is_important: false,
        is_hidden: false
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document "${file.name}" uploaded successfully`
      });

      // Refresh documents list
      fetchDocuments();
      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  }, [user, toast, fetchDocuments]);

  const moveDocument = useCallback(async (documentId: string, newFolder: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ folder: newFolder, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document moved successfully"
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error moving document:', error);
      toast({
        title: "Move Failed",
        description: error.message || "Failed to move document",
        variant: "destructive"
      });
    }
  }, [fetchDocuments, toast]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  }, [fetchDocuments, toast]);

  const searchDocuments = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchDocuments();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error searching documents:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search documents",
        variant: "destructive"
      });
    }
  }, [fetchDocuments, toast]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  return {
    documents,
    folders,
    loading,
    uploadDocument,
    deleteDocument,
    deleteFolder,
    moveDocument,
    createFolder,
    searchDocuments,
    fetchDocuments
  };
};
