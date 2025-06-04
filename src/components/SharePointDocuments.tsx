
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  File, 
  Folder, 
  Upload, 
  Search, 
  Trash2, 
  FolderPlus, 
  ExternalLink, 
  Download,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';
import { useSharePoint } from '@/hooks/useSharePoint';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { MicrosoftOAuthButton } from './MicrosoftOAuthButton';

export const SharePointDocuments: React.FC = () => {
  const {
    sites,
    documents,
    folders,
    currentSiteId,
    loading,
    setCurrentSiteId,
    uploadDocument,
    deleteDocument,
    createFolder,
    searchDocuments,
    fetchDocuments
  } = useSharePoint();
  
  const { isConnected } = useMicrosoftAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-5 w-5 text-green-600" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-700" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-5 w-5 text-orange-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      await uploadDocument(selectedFiles[i]);
    }
    
    setSelectedFiles(null);
    setUploadDialogOpen(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await createFolder(newFolderName);
    setNewFolderName('');
    setFolderDialogOpen(false);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchDocuments(searchTerm);
    } else {
      fetchDocuments();
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to SharePoint</h3>
          <p className="text-gray-600 mb-6">
            Connect your Microsoft account to access SharePoint document libraries
          </p>
          <MicrosoftOAuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle>SharePoint Sites</CardTitle>
          <CardDescription>Select a SharePoint site to manage documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Select value={currentSiteId} onValueChange={setCurrentSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a SharePoint site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentSiteId && (
              <Button 
                variant="outline" 
                onClick={() => window.open(sites.find(s => s.id === currentSiteId)?.webUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Site
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {currentSiteId && (
        <>
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Files to SharePoint</DialogTitle>
                    <DialogDescription>
                      Select files to upload to the current SharePoint document library
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="files">Select Files</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={!selectedFiles}>
                        Upload
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Create a new folder in the SharePoint document library
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Folder Name</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Folders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folders.map((folder) => (
                      <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Folder className="h-8 w-8 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{folder.name}</h4>
                              <p className="text-sm text-gray-500">
                                {folder.folder.childCount} items
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(folder.webUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documents</h3>
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {getFileIcon(doc.name)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{formatFileSize(doc.size)}</span>
                                  <span>Modified {new Date(doc.lastModifiedDateTime).toLocaleDateString()}</span>
                                  <span>by {doc.createdBy.user.displayName}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.downloadUrl, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.webUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDocument(doc.id, doc.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {documents.length === 0 && folders.length === 0 && !loading && (
                <div className="text-center py-12">
                  <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No documents match your search' : 'Upload your first document to get started'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
