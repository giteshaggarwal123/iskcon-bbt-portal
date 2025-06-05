
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Document } from '@/types/document';

export const useDocumentOperations = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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

      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  }, [user, toast]);

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
    } catch (error: any) {
      console.error('Error moving document:', error);
      toast({
        title: "Move Failed",
        description: error.message || "Failed to move document",
        variant: "destructive"
      });
    }
  }, [toast]);

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
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    uploadDocument,
    moveDocument,
    deleteDocument
  };
};
