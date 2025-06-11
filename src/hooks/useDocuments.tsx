
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  is_locked: boolean;
}

export const useDocuments = (currentFolderId?: string | null) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: {first_name: string, last_name: string}}>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');

      if (error) throw error;
      
      const profilesMap = (data || []).reduce((acc, profile) => {
        acc[profile.id] = {
          first_name: profile.first_name || '',
          last_name: profile.last_name || ''
        };
        return acc;
      }, {} as {[key: string]: {first_name: string, last_name: string}});
      
      setUserProfiles(profilesMap);
    } catch (error: any) {
      console.error('Error fetching user profiles:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents...');
      let query = supabase
        .from('documents')
        .select('*');
      
      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId);
      } else {
        query = query.is('folder_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched documents:', data);
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    }
  };

  const fetchFolders = async () => {
    try {
      console.log('Fetching folders...');
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      console.log('Fetched folders:', data);
      setFolders(data || []);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive"
      });
    }
  };

  const refreshDocuments = async () => {
    await Promise.all([fetchDocuments(), fetchFolders(), fetchUserProfiles()]);
  };

  // React Query mutations
  const renameDocumentMutation = useMutation({
    mutationFn: async ({ documentId, newName }: { documentId: string; newName: string }) => {
      const { error } = await supabase
        .from('documents')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshDocuments();
    }
  });

  const copyDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          ...original,
          id: undefined,
          name: `${original.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      refreshDocuments();
    }
  });

  const toggleImportant = useMutation({
    mutationFn: async ({ documentId, isImportant }: { documentId: string; isImportant: boolean }) => {
      const { error } = await supabase
        .from('documents')
        .update({ is_important: isImportant, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshDocuments();
    }
  });

  const moveDocument = useMutation({
    mutationFn: async ({ documentId, targetFolderId }: { documentId: string; targetFolderId: string | null }) => {
      const { error } = await supabase
        .from('documents')
        .update({ 
          folder_id: targetFolderId,
          folder: targetFolderId ? null : 'general',
          updated_at: new Date().toISOString() 
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshDocuments();
    }
  });

  const uploadDocument = async (file: File, folderId?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload documents",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Uploading document:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('Target folder ID:', folderId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folderId ? `folders/${folderId}/${fileName}` : `root/${fileName}`;
      
      console.log('Uploading to storage path:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          folder_id: folderId || null,
          folder: folderId ? null : 'general',
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Document record created:', data);

      toast({
        title: "Upload Complete",
        description: `Document "${file.name}" uploaded successfully`
      });

      await refreshDocuments();
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
          created_by: user.id,
          is_locked: false
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A folder with this name already exists in this location');
        }
        throw error;
      }

      await refreshDocuments();
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

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const { data: folderDocuments } = await supabase
        .from('documents')
        .select('id')
        .eq('folder_id', folderId);

      if (folderDocuments && folderDocuments.length > 0) {
        throw new Error('Please move or delete all documents in this folder first');
      }

      const { data: subfolders } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_folder_id', folderId);

      if (subfolders && subfolders.length > 0) {
        throw new Error('Please delete all subfolders first');
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      refreshDocuments();
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      if (!user) {
        throw new Error('Authentication required');
      }

      console.log('Deleting document:', documentId);
      
      const { error } = await supabase.rpc('move_to_recycle_bin', {
        _document_id: documentId,
        _deleted_by: user.id
      });

      if (error) throw error;
      
      console.log('Document moved to recycle bin successfully');
    },
    onSuccess: () => {
      refreshDocuments();
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      console.log('useDocuments - Initial data fetch');
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchFolders(), fetchUserProfiles()]);
      setLoading(false);
    };

    fetchData();
  }, [currentFolderId]);

  return {
    documents,
    folders,
    userProfiles,
    loading,
    uploadDocument,
    deleteDocument,
    moveDocument,
    createFolder,
    deleteFolder,
    renameDocumentMutation,
    copyDocument,
    toggleImportant,
    refreshDocuments,
    fetchDocuments,
    fetchFolders
  };
};
