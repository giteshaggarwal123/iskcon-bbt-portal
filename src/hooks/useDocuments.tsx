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

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents...');
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

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

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('A folder with this name already exists in this location');
        }
        throw error;
      }

      toast({
        title: "Success",
        description: `Folder "${folderName}" created successfully`
      });

      await fetchFolders(); // Refresh folders list
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

  const deleteFolder = async (folderId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete folders",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Check if folder has documents
      const { data: folderDocuments } = await supabase
        .from('documents')
        .select('id')
        .eq('folder_id', folderId);

      if (folderDocuments && folderDocuments.length > 0) {
        toast({
          title: "Cannot Delete Folder",
          description: "Please move or delete all documents in this folder first",
          variant: "destructive"
        });
        return false;
      }

      // Check if folder has subfolders
      const { data: subfolders } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_folder_id', folderId);

      if (subfolders && subfolders.length > 0) {
        toast({
          title: "Cannot Delete Folder",
          description: "Please delete all subfolders first",
          variant: "destructive"
        });
        return false;
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

      await fetchFolders(); // Refresh folders list
      return true;
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete folder",
        variant: "destructive"
      });
      return false;
    }
  };

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
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folderId ? `folders/${folderId}/${fileName}` : `root/${fileName}`;
      
      console.log('Uploading to storage path:', filePath);
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);
      
      // Create document record in database
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

      await fetchDocuments();
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

  const moveDocument = async (documentId: string, newFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          folder_id: newFolderId,
          folder: newFolderId ? null : 'general', // Keep legacy folder field for backward compatibility
          updated_at: new Date().toISOString() 
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document moved successfully"
      });

      await fetchDocuments(); // Refresh documents list
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

  const getFolderPath = async (folderId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_folder_path', {
        folder_id: folderId
      });

      if (error) throw error;
      return data || '';
    } catch (error) {
      console.error('Error getting folder path:', error);
      return '';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log('useDocuments - Initial data fetch');
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchFolders()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    documents,
    folders,
    loading,
    uploadDocument,
    deleteDocument,
    moveDocument,
    createFolder,
    deleteFolder,
    searchDocuments,
    fetchDocuments,
    fetchFolders,
    getFolderPath
  };
};
