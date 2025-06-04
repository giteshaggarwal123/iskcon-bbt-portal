
import { supabase } from '@/integrations/supabase/client';

export interface SharePointSite {
  id: string;
  name: string;
  webUrl: string;
}

export interface SharePointDocument {
  id: string;
  name: string;
  webUrl: string;
  downloadUrl: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  parentReference: {
    path: string;
  };
}

export interface SharePointFolder {
  id: string;
  name: string;
  webUrl: string;
  folder: {
    childCount: number;
  };
  parentReference: {
    path: string;
  };
}

class SharePointService {
  private async getAccessToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-sharepoint-token');
      if (error) throw error;
      return data.access_token;
    } catch (error) {
      console.error('Error getting SharePoint access token:', error);
      return null;
    }
  }

  private async makeGraphRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('No access token available');

    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`SharePoint API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getSites(): Promise<SharePointSite[]> {
    try {
      const data = await this.makeGraphRequest('/sites?search=*');
      return data.value || [];
    } catch (error) {
      console.error('Error fetching SharePoint sites:', error);
      return [];
    }
  }

  async getDocuments(siteId: string, driveId?: string): Promise<SharePointDocument[]> {
    try {
      const endpoint = driveId 
        ? `/sites/${siteId}/drives/${driveId}/root/children`
        : `/sites/${siteId}/drive/root/children`;
      
      const data = await this.makeGraphRequest(endpoint);
      return data.value?.filter((item: any) => item.file) || [];
    } catch (error) {
      console.error('Error fetching SharePoint documents:', error);
      return [];
    }
  }

  async getFolders(siteId: string, driveId?: string): Promise<SharePointFolder[]> {
    try {
      const endpoint = driveId 
        ? `/sites/${siteId}/drives/${driveId}/root/children`
        : `/sites/${siteId}/drive/root/children`;
      
      const data = await this.makeGraphRequest(endpoint);
      return data.value?.filter((item: any) => item.folder) || [];
    } catch (error) {
      console.error('Error fetching SharePoint folders:', error);
      return [];
    }
  }

  async uploadDocument(
    siteId: string, 
    fileName: string, 
    file: File, 
    folderPath = ''
  ): Promise<SharePointDocument | null> {
    try {
      const uploadPath = folderPath 
        ? `/sites/${siteId}/drive/root:/${folderPath}/${fileName}:/content`
        : `/sites/${siteId}/drive/root:/${fileName}:/content`;

      const response = await this.makeGraphRequest(uploadPath, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      return response;
    } catch (error) {
      console.error('Error uploading document to SharePoint:', error);
      return null;
    }
  }

  async deleteDocument(siteId: string, itemId: string): Promise<boolean> {
    try {
      await this.makeGraphRequest(`/sites/${siteId}/drive/items/${itemId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting document from SharePoint:', error);
      return false;
    }
  }

  async createFolder(siteId: string, folderName: string, parentPath = ''): Promise<SharePointFolder | null> {
    try {
      const endpoint = parentPath
        ? `/sites/${siteId}/drive/root:/${parentPath}:/children`
        : `/sites/${siteId}/drive/root/children`;

      const response = await this.makeGraphRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        }),
      });

      return response;
    } catch (error) {
      console.error('Error creating folder in SharePoint:', error);
      return null;
    }
  }

  async searchDocuments(siteId: string, query: string): Promise<SharePointDocument[]> {
    try {
      const data = await this.makeGraphRequest(`/sites/${siteId}/drive/root/search(q='${encodeURIComponent(query)}')`);
      return data.value?.filter((item: any) => item.file) || [];
    } catch (error) {
      console.error('Error searching documents in SharePoint:', error);
      return [];
    }
  }
}

export const sharePointService = new SharePointService();
