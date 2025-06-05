
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
  folder_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  is_important: boolean;
  is_hidden: boolean;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          folders!documents_folder_id_fkey(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include folder information
      const transformedDocs = (data || []).map(doc => ({
        ...doc,
        folder: doc.folders?.name || doc.folder || 'general'
      }));
      
      setDocuments(transformedDocs);
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

  const uploadDocument = async (file: File, folderId?: string | null) => {
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
          file_path: `/uploads/${folderId || 'general'}/${file.name}`,
          file_size: file.size,
          mime_type: file.type,
          folder_id: folderId || null,
          folder: folderId ? null : 'general', // Keep old folder field for backward compatibility
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

  const moveDocument = async (documentId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          folder_id: folderId,
          folder: folderId ? null : 'general', // Keep old folder field for backward compatibility
          updated_at: new Date().toISOString() 
        })
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
        .select(`
          *,
          folders!documents_folder_id_fkey(
            id,
            name
          )
        `)
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedDocs = (data || []).map(doc => ({
        ...doc,
        folder: doc.folders?.name || doc.folder || 'general'
      }));
      
      setDocuments(transformedDocs);
    } catch (error: any) {
      console.error('Error searching documents:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search documents",
        variant: "destructive"
      });
    }
  };

  // Set up realtime subscription for auto-refresh
  useEffect(() => {
    fetchDocuments();

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
  }, []);

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    moveDocument,
    searchDocuments,
    fetchDocuments
  };
};
