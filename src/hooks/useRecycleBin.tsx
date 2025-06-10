
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface RecycleBinItem {
  id: string;
  original_document_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  folder: string | null;
  uploaded_by: string;
  deleted_by: string;
  deleted_at: string;
  permanent_delete_at: string;
  original_created_at: string;
  original_updated_at: string;
  is_important: boolean;
  is_hidden: boolean;
}

export const useRecycleBin = () => {
  const [recycleBinItems, setRecycleBinItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecycleBinItems = async () => {
    try {
      const { data, error } = await supabase
        .from('recycle_bin')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setRecycleBinItems(data || []);
    } catch (error: any) {
      console.error('Error fetching recycle bin items:', error);
      toast({
        title: "Error",
        description: "Failed to load recycle bin items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreDocument = async (recycleBinId: string, documentName: string) => {
    try {
      // Use the database function to restore from recycle bin
      const { error } = await supabase.rpc('restore_from_recycle_bin', {
        _recycle_bin_id: recycleBinId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${documentName}" has been restored`
      });

      // Refresh the recycle bin items
      await fetchRecycleBinItems();
    } catch (error: any) {
      console.error('Error restoring document:', error);
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore document",
        variant: "destructive"
      });
    }
  };

  const permanentlyDeleteDocument = async (recycleBinId: string, documentName: string) => {
    try {
      const { error } = await supabase
        .from('recycle_bin')
        .delete()
        .eq('id', recycleBinId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${documentName}" has been permanently deleted`
      });

      // Refresh the recycle bin items
      await fetchRecycleBinItems();
    } catch (error: any) {
      console.error('Error permanently deleting document:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to permanently delete document",
        variant: "destructive"
      });
    }
  };

  const cleanupExpiredItems = async () => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_recycle_bin');
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expired items have been cleaned up"
      });

      // Refresh the recycle bin items
      await fetchRecycleBinItems();
    } catch (error: any) {
      console.error('Error cleaning up expired items:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to cleanup expired items",
        variant: "destructive"
      });
    }
  };

  const getDaysUntilPermanentDelete = (permanentDeleteAt: string) => {
    const deleteDate = new Date(permanentDeleteAt);
    const now = new Date();
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Set up realtime subscription for auto-refresh
  useEffect(() => {
    fetchRecycleBinItems();

    const channel = supabase
      .channel('recycle-bin-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recycle_bin'
        },
        (payload) => {
          console.log('Recycle bin changed:', payload);
          fetchRecycleBinItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    recycleBinItems,
    loading,
    fetchRecycleBinItems,
    restoreDocument,
    permanentlyDeleteDocument,
    cleanupExpiredItems,
    getDaysUntilPermanentDelete
  };
};
