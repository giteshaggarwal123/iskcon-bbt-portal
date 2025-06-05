
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { Document } from '@/types/document';

export const useDocumentSearch = () => {
  const { toast } = useToast();

  const searchDocuments = useCallback(async (searchTerm: string): Promise<Document[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error searching documents:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search documents",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  return {
    searchDocuments
  };
};
