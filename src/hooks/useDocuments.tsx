
import { useState, useEffect } from 'react';
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
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const docs = data || [];
      setDocuments(docs);
      
      // Extract unique folders
      const uniqueFolders = [...new Set(docs.map(doc => doc.folder).filter(Boolean))];
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
  };

  const createFolder = async (folderName: string) => {
    // Just add to folders list - folders are created when documents are uploaded to them
    if (!folders.includes(folderName)) {
      setFolders(prev => [...prev, folderName]);
      toast({
        title: "Success",
        description: `Folder "${folderName}" created successfully`
      });
    }
    return folderName;
  };

  const uploadDocument = async (file: File, folder: string = 'general') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload documents",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: `/uploads/${folder}/${file.name}`,
          file_size: file.size,
          mime_type: file.type,
          folder: folder,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document "${file.name}" uploaded successfully`
      });

      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  };

  const moveDocument = async (documentId: string, newFolder: string) => {
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
    } catch (error: any) {
      console.error('Error moving document:', error);
      toast({
        title: "Move Failed",
        description: error.message || "Failed to move document",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete documents",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use the database function to move to recycle bin
      const { error } = await supabase.rpc('move_to_recycle_bin', {
        _document_id: documentId,
        _deleted_by: user.id
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  const searchDocuments = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchDocuments();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

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
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    folders,
    loading,
    uploadDocument,
    deleteDocument,
    moveDocument,
    createFolder,
    searchDocuments,
    fetchDocuments
  };
};
