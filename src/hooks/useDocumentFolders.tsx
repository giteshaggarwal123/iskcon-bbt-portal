
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useDocumentFolders = () => {
  const { toast } = useToast();

  const createFolder = useCallback(async (folderName: string) => {
    try {
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
  }, [toast]);

  const deleteFolder = useCallback(async (folderName: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('folder', folderName);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Folder "${folderName}" and all its contents deleted successfully`
      });
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    createFolder,
    deleteFolder
  };
};
