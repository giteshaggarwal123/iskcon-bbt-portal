
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { 
  sharePointService, 
  SharePointSite, 
  SharePointDocument, 
  SharePointFolder 
} from '@/services/sharePointService';

export const useSharePoint = () => {
  const [sites, setSites] = useState<SharePointSite[]>([]);
  const [documents, setDocuments] = useState<SharePointDocument[]>([]);
  const [folders, setFolders] = useState<SharePointFolder[]>([]);
  const [currentSiteId, setCurrentSiteId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isConnected } = useMicrosoftAuth();

  const fetchSites = async () => {
    if (!isConnected) {
      toast({
        title: "Microsoft Account Required",
        description: "Please connect your Microsoft account to access SharePoint",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const fetchedSites = await sharePointService.getSites();
      setSites(fetchedSites);
      
      // Auto-select first site if available
      if (fetchedSites.length > 0 && !currentSiteId) {
        setCurrentSiteId(fetchedSites[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch SharePoint sites",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (siteId?: string) => {
    const targetSiteId = siteId || currentSiteId;
    if (!targetSiteId || !isConnected) return;

    setLoading(true);
    try {
      const [fetchedDocuments, fetchedFolders] = await Promise.all([
        sharePointService.getDocuments(targetSiteId),
        sharePointService.getFolders(targetSiteId)
      ]);
      
      setDocuments(fetchedDocuments);
      setFolders(fetchedFolders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch documents from SharePoint",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, folderPath?: string) => {
    if (!currentSiteId || !isConnected) {
      toast({
        title: "Error",
        description: "No SharePoint site selected or not connected",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await sharePointService.uploadDocument(
        currentSiteId, 
        file.name, 
        file, 
        folderPath
      );

      if (result) {
        toast({
          title: "Success",
          description: `Document "${file.name}" uploaded to SharePoint`,
        });
        fetchDocuments();
        return result;
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (itemId: string, fileName: string) => {
    if (!currentSiteId || !isConnected) return;

    try {
      const success = await sharePointService.deleteDocument(currentSiteId, itemId);
      
      if (success) {
        toast({
          title: "Success",
          description: `Document "${fileName}" deleted from SharePoint`,
        });
        fetchDocuments();
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const createFolder = async (folderName: string, parentPath?: string) => {
    if (!currentSiteId || !isConnected) return;

    try {
      const result = await sharePointService.createFolder(
        currentSiteId, 
        folderName, 
        parentPath
      );

      if (result) {
        toast({
          title: "Success",
          description: `Folder "${folderName}" created in SharePoint`,
        });
        fetchDocuments();
        return result;
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const searchDocuments = async (query: string) => {
    if (!currentSiteId || !isConnected || !query.trim()) return;

    setLoading(true);
    try {
      const results = await sharePointService.searchDocuments(currentSiteId, query);
      setDocuments(results);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: "Failed to search documents in SharePoint",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchSites();
    }
  }, [isConnected]);

  useEffect(() => {
    if (currentSiteId) {
      fetchDocuments();
    }
  }, [currentSiteId]);

  return {
    sites,
    documents,
    folders,
    currentSiteId,
    loading,
    setCurrentSiteId,
    fetchSites,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    createFolder,
    searchDocuments
  };
};
