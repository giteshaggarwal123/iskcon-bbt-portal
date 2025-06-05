
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
}

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (folderName: string, parentFolderId?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create folders",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: folderName.trim(),
          parent_folder_id: parentFolderId || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Folder "${folderName}" created successfully`
      });

      return data;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast({
        title: "Create Failed",
        description: error.message || "Failed to create folder",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', folderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating folder:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update folder",
        variant: "destructive"
      });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      // Check if folder has documents
      const { data: documentsInFolder, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('folder_id', folderId);

      if (docError) throw docError;

      if (documentsInFolder && documentsInFolder.length > 0) {
        toast({
          title: "Cannot Delete Folder",
          description: "Please move or delete all documents from this folder first",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete folder",
        variant: "destructive"
      });
    }
  };

  // Set up realtime subscription for auto-refresh
  useEffect(() => {
    fetchFolders();

    const channel = supabase
      .channel('folders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        (payload) => {
          console.log('Folders table changed:', payload);
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchFolders
  };
};
