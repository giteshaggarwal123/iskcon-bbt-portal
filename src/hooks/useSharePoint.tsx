
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { useToast } from './use-toast';

export const useSharePoint = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { isConnected, accessToken } = useMicrosoftAuth();
  const { toast } = useToast();

  const uploadToSharePoint = async (file: File, folder: string = 'Documents') => {
    if (!isConnected || !accessToken) {
      toast({
        title: "Microsoft Account Required",
        description: "Please connect your Microsoft account to upload to SharePoint",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      // Convert file to base64 for transmission
      const fileBuffer = await file.arrayBuffer();
      
      const { data, error } = await supabase.functions.invoke('sharepoint-integration', {
        body: {
          action: 'upload',
          fileName: file.name,
          fileContent: Array.from(new Uint8Array(fileBuffer)),
          folder: folder
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Create document record with SharePoint metadata
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: data.file.webUrl,
          file_size: data.file.size,
          mime_type: file.type,
          folder: folder,
          uploaded_by: user?.id || '',
          is_sharepoint_file: true,
          sharepoint_id: data.file.id,
          sharepoint_url: data.file.webUrl,
          is_important: false,
          is_hidden: false
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create SharePoint file record
      await supabase
        .from('sharepoint_files')
        .insert({
          document_id: document.id,
          sharepoint_id: data.file.id,
          sharepoint_url: data.file.webUrl,
          download_url: data.file.downloadUrl,
          web_url: data.file.webUrl,
          drive_id: data.file.driveId,
          item_id: data.file.itemId,
          etag: data.file.etag
        });

      toast({
        title: "Upload Successful",
        description: `File "${file.name}" uploaded to SharePoint successfully`
      });

      return document;

    } catch (error: any) {
      console.error('SharePoint upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file to SharePoint",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadFromSharePoint = async (documentId: string) => {
    if (!isConnected || !accessToken) {
      toast({
        title: "Microsoft Account Required",
        description: "Please connect your Microsoft account to download from SharePoint",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get SharePoint file metadata
      const { data: spFile, error: spError } = await supabase
        .from('sharepoint_files')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (spError) throw spError;

      const { data, error } = await supabase.functions.invoke('sharepoint-integration', {
        body: {
          action: 'download',
          driveId: spFile.drive_id,
          itemId: spFile.item_id
        }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      
      // Get document name
      const { data: documentData } = await supabase
        .from('documents')
        .select('name')
        .eq('id', documentId)
        .single();

      const link = document.createElement('a');
      link.href = url;
      link.download = documentData?.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "File download from SharePoint started"
      });

    } catch (error: any) {
      console.error('SharePoint download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file from SharePoint",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFromSharePoint = async (documentId: string) => {
    if (!isConnected || !accessToken) {
      toast({
        title: "Microsoft Account Required",
        description: "Please connect your Microsoft account to delete from SharePoint",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Get SharePoint file metadata
      const { data: spFile, error: spError } = await supabase
        .from('sharepoint_files')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (spError) throw spError;

      const { data, error } = await supabase.functions.invoke('sharepoint-integration', {
        body: {
          action: 'delete',
          driveId: spFile.drive_id,
          itemId: spFile.item_id
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "File Deleted",
        description: "File deleted from SharePoint successfully"
      });

      return true;

    } catch (error: any) {
      console.error('SharePoint delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file from SharePoint",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openSharePointFile = async (documentId: string) => {
    try {
      // Get SharePoint file metadata
      const { data: documentData, error } = await supabase
        .from('documents')
        .select('sharepoint_url, name')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      if (documentData.sharepoint_url) {
        // Open SharePoint file in new tab
        window.open(documentData.sharepoint_url, '_blank');
        
        toast({
          title: "Opening File",
          description: `Opening "${documentData.name}" in SharePoint`
        });
      } else {
        throw new Error('SharePoint URL not found');
      }

    } catch (error: any) {
      console.error('Error opening SharePoint file:', error);
      toast({
        title: "Error",
        description: "Failed to open SharePoint file",
        variant: "destructive"
      });
    }
  };

  const syncWithSharePoint = async () => {
    if (!isConnected || !accessToken) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('sharepoint-integration', {
        body: {
          action: 'list',
          folder: 'Documents'
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Sync files with local database
      for (const file of data.files) {
        const { data: existing } = await supabase
          .from('documents')
          .select('id')
          .eq('sharepoint_id', file.id)
          .single();

        if (!existing) {
          // Create new document record
          const { data: document } = await supabase
            .from('documents')
            .insert({
              name: file.name,
              file_path: file.webUrl,
              file_size: file.size,
              mime_type: 'application/octet-stream',
              folder: 'Documents',
              uploaded_by: user?.id || '',
              is_sharepoint_file: true,
              sharepoint_id: file.id,
              sharepoint_url: file.webUrl,
              is_important: false,
              is_hidden: false
            })
            .select()
            .single();

          if (document) {
            // Create SharePoint file record
            await supabase
              .from('sharepoint_files')
              .insert({
                document_id: document.id,
                sharepoint_id: file.id,
                sharepoint_url: file.webUrl,
                download_url: file.downloadUrl,
                web_url: file.webUrl,
                drive_id: file.driveId,
                item_id: file.itemId,
                etag: file.etag
              });
          }
        }
      }

      toast({
        title: "Sync Complete",
        description: "Documents synced with SharePoint"
      });

    } catch (error: any) {
      console.error('SharePoint sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with SharePoint",
        variant: "destructive"
      });
    }
  };

  return {
    loading,
    isConnected,
    uploadToSharePoint,
    downloadFromSharePoint,
    deleteFromSharePoint,
    openSharePointFile,
    syncWithSharePoint
  };
};
